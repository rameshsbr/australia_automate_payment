// pages/api/manage/subscriptions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  listSubscriptions, createSubscription, updateSubscription, deleteSubscription,
  resendLegacy, reportLegacy,
  type MonoovaEnv, type MonoovaService, type CreateUpdatePayload,
} from "../../../lib/monoova/subscriptions";

const assertIn = (name: string, v: string, allowed: string[]) => {
  if (!allowed.includes(v)) throw new Error(`${name} must be one of: ${allowed.join(", ")}`);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const service = (req.query.service as MonoovaService) || "notification";
    const env = (req.query.env as MonoovaEnv) || "sandbox";
    const action = String(req.query.action || "");

    assertIn("service", service, ["notification", "legacy"]);
    assertIn("env", env, ["sandbox", "live"]);

    // --- Action endpoints (legacy only) ---
    if (action === "resend") {
      if (service !== "legacy") throw new Error("Resend is supported on Legacy Subscriptions only");
      if (req.method !== "POST") throw new Error("Use POST for action=resend");
      const id = String(req.query.id || "");
      if (!id) throw new Error("id is required");
      const out = await resendLegacy(env, id);
      res.status(200).json(out);
      return;
    }

    if (action === "report") {
      if (service !== "legacy") throw new Error("Report is supported on Legacy Subscriptions only");
      if (req.method !== "GET") throw new Error("Use GET for action=report");
      const date = String(req.query.date || "");
      if (!date) throw new Error("date (YYYY-MM-DD) is required");
      const out = await reportLegacy(env, date);
      res.status(200).json(out);
      return;
    }

    // --- CRUD ---
    if (req.method === "GET") {
      const rows = await listSubscriptions(service, env);
      res.status(200).json({ rows });
      return;
    }

    if (req.method === "POST") {
      const b = req.body as Partial<CreateUpdatePayload>;
      if (!b?.eventName || !b?.callbackUrl) throw new Error("eventName and callbackUrl are required");
      const out = await createSubscription(service, env, {
        subscriptionName: b.subscriptionName ?? b.eventName,
        eventName: b.eventName,
        callbackUrl: b.callbackUrl,
        isActive: b.isActive ?? true,
        emailTo: b.emailTo ?? [],
        emailBcc: b.emailBcc ?? [],
      });
      res.status(201).json(out);
      return;
    }

    if (req.method === "PUT") {
      const id = String(req.query.id || "");
      if (!id) throw new Error("id is required");
      const b = req.body as Partial<CreateUpdatePayload>;
      if (!b?.eventName || !b?.callbackUrl) throw new Error("eventName and callbackUrl are required");
      const out = await updateSubscription(service, env, id, {
        subscriptionName: b.subscriptionName ?? b.eventName,
        eventName: b.eventName,
        callbackUrl: b.callbackUrl,
        isActive: b.isActive ?? true,
        emailTo: b.emailTo ?? [],
        emailBcc: b.emailBcc ?? [],
      });
      res.status(200).json(out);
      return;
    }

    if (req.method === "DELETE") {
      const id = String(req.query.id || "");
      if (!id) throw new Error("id is required");
      await deleteSubscription(service, env, id);
      res.status(204).end();
      return;
    }

    res.setHeader("Allow", "GET,POST,PUT,DELETE");
    res.status(405).json({ error: "Method Not Allowed" });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? String(err) });
  }
}