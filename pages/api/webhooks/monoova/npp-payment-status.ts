// pages/api/webhooks/monoova/npp-payment-status.ts
import type { NextApiResponse } from "next";
import { recordWebhook } from "@/lib/monoova/webhooks";
import { logEvent } from "@/lib/obs";
import { withMonoovaVerify, config as verifyConfig, MonoovaWebhookRequest } from "../_monoova-verify";

export const config = verifyConfig;

async function handler(req: MonoovaWebhookRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const payload =
    (req as any).monoovaPayload ??
    (typeof (req as any).body === "string" ? JSON.parse((req as any).body || "{}") : (req as any).body || {});

  const kind = String(payload?.type ?? payload?.event ?? "npppaymentstatus").toLowerCase();
  logEvent("monoova_npp_status_in", { kind });

  await recordWebhook("npp-payment-status", payload, true, "verified");
  res.status(200).json({ received: true });
}

export default withMonoovaVerify(handler);