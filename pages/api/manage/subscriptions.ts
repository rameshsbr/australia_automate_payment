// pages/api/manage/subscriptions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  resendLegacy,
  reportLegacy,
  type CreateUpdatePayload,
} from "../../../lib/monoova/subscriptions";
import { z } from "zod";

// ——— Prisma import made tolerant to both default and named exports ———
import * as PrismaExport from "../../../lib/prisma";
const prisma: any = (PrismaExport as any).default ?? (PrismaExport as any).prisma ?? null;

// Notification Management events (kept for backwards compatibility; not used)
const NOTIFICATION_EVENTS = [
  "paymentagreementnotification",
  "paymentinstructionnotification",
  "creditcardpaymentnotification",
  "creditcardrefundnotification",
  "asyncjobresultnotification",
] as const;

const LEGACY_EVENTS = [
  "nppreceivepayment",
  "paytoreceivepayment",
  "inbounddirectcredit",
  "directdebitclearance",
  "directentrydishonour",
  "pendinginboundrtgsimt",
  "inboundrtgsimtstatus",
  "inbounddirectdebit",
  "nppreturn",
  "npppaymentstatus",
  "inbounddirectcreditrejections",
  "nppcreditrejections",
] as const;

const EnvSchema = z.enum(["sandbox", "live"]);
const QueryBase = z.object({
  env: EnvSchema.default("sandbox"),
  service: z.enum(["notification", "legacy"]).optional(), // accepted for compatibility; ignored below
  action: z.enum(["resend", "report"]).optional(),
  id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const BodySchema = z.object({
  subscriptionName: z.string().trim().max(128).optional(),
  eventName: z.string().trim(),
  callbackUrl: z.string().url(),
  isActive: z.boolean().optional(),
  emailTo: z.array(z.string().email()).optional(),
  emailBcc: z.array(z.string().email()).optional(),
});

// 👉 Pin service to legacy regardless of event (Payments API only)
function inferService(_eventName: string) {
  return "legacy" as const;
}

function requireApiKey(req: NextApiRequest): string | null {
  const k = req.headers["x-api-key"];
  const v = Array.isArray(k) ? k[0] : k;
  return v && v.trim().length > 0 ? null : "Missing x-api-key";
}

async function cacheUpsert(env: string, row: {
  service: string; subscriptionId: string; subscriptionName?: string; eventName: string;
  callbackUrl: string; isActive: boolean; emailTo?: string[]; emailBcc?: string[];
}) {
  if (!prisma) return;
  await prisma.subscriptionCache.upsert({
    where: { env_service_subscriptionId: { env, service: row.service, subscriptionId: row.subscriptionId } },
    create: {
      env, service: row.service, subscriptionId: row.subscriptionId,
      subscriptionName: row.subscriptionName ?? null,
      eventName: row.eventName, callbackUrl: row.callbackUrl, isActive: row.isActive,
      emailTo: row.emailTo ? JSON.stringify(row.emailTo) : null,
      emailBcc: row.emailBcc ? JSON.stringify(row.emailBcc) : null,
    },
    update: {
      subscriptionName: row.subscriptionName ?? null,
      eventName: row.eventName, callbackUrl: row.callbackUrl, isActive: row.isActive,
      emailTo: row.emailTo ? JSON.stringify(row.emailTo) : null,
      emailBcc: row.emailBcc ? JSON.stringify(row.emailBcc) : null,
    },
  });
}

async function cacheDelete(env: string, service: string, id: string) {
  if (!prisma) return;
  try {
    await prisma.subscriptionCache.delete({
      where: { env_service_subscriptionId: { env, service, subscriptionId: id } },
    });
  } catch {
    // ignore if not present
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKeyError = requireApiKey(req);
  if (apiKeyError) return res.status(401).json({ error: apiKeyError });

  try {
    const q = QueryBase.parse({
      env: req.query.env,
      service: req.query.service,
      action: req.query.action,
      id: req.query.id,
      date: req.query.date,
    }) as any;

    // --- Action routes (legacy only) ---
    if (q.action === "resend") {
      if (req.method !== "POST") return res.status(405).json({ error: "Use POST for action=resend" });
      if (!q.id) return res.status(400).json({ error: "id is required" });
      const out = await resendLegacy(q.env, String(q.id));
      return res.status(200).json(out);
    }

    if (q.action === "report") {
      if (req.method !== "GET") return res.status(405).json({ error: "Use GET for action=report" });
      if (!q.date) return res.status(400).json({ error: "date (YYYY-MM-DD) is required" });
      const out = await reportLegacy(q.env, String(q.date));
      return res.status(200).json(out);
    }

    // --- CRUD (legacy only) ---
    const service = "legacy" as const;

    if (req.method === "GET") {
      const id = toStr(req.query.id);
      if (id) {
        const row = await getSubscription(service, q.env, id);
        if (row) {
          await cacheUpsert(q.env, row);
          return res.status(200).json({ row });
        }
        return res.status(404).json({ error: "Subscription not found" });
      }

      const rows = await listSubscriptions(service, q.env);
      await Promise.all(rows.map((r) => cacheUpsert(q.env, r)));
      return res.status(200).json({ rows });
    }

    if (req.method === "POST") {
      const b = BodySchema.parse(req.body) as CreateUpdatePayload;
      const idem = headerStr(req.headers["idempotency-key"]);
      const out = await createSubscription(service, q.env, b, { idempotencyKey: idem || undefined });

      if (out?.subscriptionId) {
        const row = await getSubscription(service, q.env, out.subscriptionId);
        if (row) await cacheUpsert(q.env, row);
      }
      return res.status(201).json({ ...out, service });
    }

    if (req.method === "PUT") {
      const id = toStr(req.query.id);
      if (!id) return res.status(400).json({ error: "id is required" });
      const b = BodySchema.parse(req.body) as CreateUpdatePayload;
      const idem = headerStr(req.headers["idempotency-key"]);
      const out = await updateSubscription(service, q.env, id, b, { idempotencyKey: idem || undefined });

      const row = await getSubscription(service, q.env, out?.subscriptionId ?? id);
      if (row) await cacheUpsert(q.env, row);
      return res.status(200).json({ ...out, service });
    }

    if (req.method === "DELETE") {
      const id = toStr(req.query.id);
      if (!id) return res.status(400).json({ error: "id is required" });
      await deleteSubscription(service, q.env, id);
      await cacheDelete(q.env, service, id);
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET,POST,PUT,DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    const status =
      /Unknown eventName/i.test(msg) ? 400 :
      /Validation/i.test(msg) ? 400 :
      /Missing/i.test(msg) ? 400 : 500;
    return res.status(status).json({ error: msg });
  }
}

function toStr(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}
function headerStr(v: string | string[] | undefined): string | null {
  if (!v) return null;
  return (Array.isArray(v) ? v[0] : v).trim() || null;
}
