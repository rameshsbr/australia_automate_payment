// pages/api/manage/subscriptions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  listSubscriptions, createSubscription, updateSubscription, deleteSubscription,
  resendLegacy, reportLegacy,
  type MonoovaEnv, type MonoovaService, type CreateUpdatePayload,
} from "../../../lib/monoova/subscriptions";
import { z } from "zod";

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
  service: z.enum(["notification", "legacy"]).optional(), // may be inferred
  action: z.enum(["resend", "report"]).optional(),
  id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const BodySchema = z.object({
  subscriptionName: z.string().trim().max(128).optional(),
  eventName: z.string().trim(),
  callbackUrl: z.string().url(),
  isActive: z.boolean().optional(),
});

function inferService(eventName: string): MonoovaService {
  if ((NOTIFICATION_EVENTS as readonly string[]).includes(eventName)) return "notification";
  if ((LEGACY_EVENTS as readonly string[]).includes(eventName)) return "legacy";
  throw new Error(`Unknown eventName: ${eventName}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const q = QueryBase.parse({
      env: req.query.env,
      service: req.query.service,
      action: req.query.action,
      id: req.query.id,
      date: req.query.date,
    }) as any;

    // Action routes (legacy only)
    if (q.action === "resend") {
      if (req.method !== "POST") throw new Error("Use POST for action=resend");
      if (!q.id) throw new Error("id is required");
      const out = await resendLegacy(q.env, String(q.id));
      res.status(200).json(out);
      return;
    }

    if (q.action === "report") {
      if (req.method !== "GET") throw new Error("Use GET for action=report");
      if (!q.date) throw new Error("date (YYYY-MM-DD) is required");
      const out = await reportLegacy(q.env, String(q.date));
      res.status(200).json(out);
      return;
    }

    // CRUD
    if (req.method === "GET") {
      const service = (req.query.service as MonoovaService) || "notification";
      const rows = await listSubscriptions(service, q.env);
      res.status(200).json({ rows });
      return;
    }

    if (req.method === "POST") {
      const b = BodySchema.parse(req.body) as CreateUpdatePayload;
      const service = inferService(b.eventName);
      const out = await createSubscription(service, q.env, b);
      res.status(201).json({ ...out, service });
      return;
    }

    if (req.method === "PUT") {
      const id = String(req.query.id || "");
      if (!id) throw new Error("id is required");
      const b = BodySchema.parse(req.body) as CreateUpdatePayload;
      const service = inferService(b.eventName);
      const out = await updateSubscription(service, q.env, id, b);
      res.status(200).json({ ...out, service });
      return;
    }

    if (req.method === "DELETE") {
      const id = String(req.query.id || "");
      if (!id) throw new Error("id is required");
      // For delete we can infer from client row; if unknown, try both (NM first)
      try {
        await deleteSubscription("notification", q.env, id);
      } catch {
        await deleteSubscription("legacy", q.env, id);
      }
      res.status(204).end();
      return;
    }

    res.setHeader("Allow", "GET,POST,PUT,DELETE");
    res.status(405).json({ error: "Method Not Allowed" });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? String(err) });
  }
}