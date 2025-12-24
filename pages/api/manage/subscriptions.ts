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
  type MonoovaEnv,
  type MonoovaService,
  type CreateUpdatePayload,
} from "../../../lib/monoova/subscriptions";
import { z } from "zod";

// Notification Management events (lowercase to match your infer logic)
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
  service: z.enum(["notification", "legacy"]).optional(),
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

function inferService(eventName: string): MonoovaService {
  const v = (eventName || "").toLowerCase();
  if ((NOTIFICATION_EVENTS as readonly string[]).includes(v)) return "notification";
  if ((LEGACY_EVENTS as readonly string[]).includes(v)) return "legacy";
  throw new Error(`Unknown eventName: ${eventName}`);
}

function requireApiKey(req: NextApiRequest): string | null {
  const k = req.headers["x-api-key"];
  const v = Array.isArray(k) ? k[0] : k;
  return v && v.trim().length > 0 ? null : "Missing x-api-key";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // why: prevent public abuse; aligns with your provider-facing contract
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

    // --- CRUD ---
    if (req.method === "GET") {
      const id = toStr(req.query.id);
      const service = (req.query.service as MonoovaService) || "notification";

      if (id) {
        // try requested service first; if not found and no explicit service, fallback to the other
        const primary = await getSubscription(service, q.env, id);
        if (primary) return res.status(200).json({ row: primary });

        if (!req.query.service) {
          const alt: MonoovaService = service === "notification" ? "legacy" : "notification";
          const secondary = await getSubscription(alt, q.env, id);
          if (secondary) return res.status(200).json({ row: secondary });
        }
        return res.status(404).json({ error: "Subscription not found" });
      }

      const rows = await listSubscriptions(service, q.env);
      return res.status(200).json({ rows });
    }

    if (req.method === "POST") {
      const b = BodySchema.parse(req.body) as CreateUpdatePayload;
      const service = inferService(b.eventName);
      const idem = headerStr(req.headers["idempotency-key"]);
      const out = await createSubscription(service, q.env, b, { idempotencyKey: idem || undefined });
      return res.status(201).json({ ...out, service });
    }

    if (req.method === "PUT") {
      const id = toStr(req.query.id);
      if (!id) return res.status(400).json({ error: "id is required" });
      const b = BodySchema.parse(req.body) as CreateUpdatePayload;
      const service = inferService(b.eventName);
      const idem = headerStr(req.headers["idempotency-key"]);
      const out = await updateSubscription(service, q.env, id, b, { idempotencyKey: idem || undefined });
      return res.status(200).json({ ...out, service });
    }

    if (req.method === "DELETE") {
      const id = toStr(req.query.id);
      if (!id) return res.status(400).json({ error: "id is required" });

      try {
        await deleteSubscription("notification", q.env, id);
      } catch {
        await deleteSubscription("legacy", q.env, id);
      }
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