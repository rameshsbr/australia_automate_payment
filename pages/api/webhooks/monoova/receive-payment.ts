import type { NextApiResponse } from "next";
import { recordWebhook } from "@/lib/monoova/webhooks";
import { withMonoovaVerify, config as verifyConfig, MonoovaWebhookRequest } from "../_monoova-verify";

export const config = verifyConfig;

async function handler(req: MonoovaWebhookRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const payload =
    (req as any).monoovaPayload ??
    (typeof (req as any).body === "string" ? JSON.parse((req as any).body || "{}") : (req as any).body || {});
  await recordWebhook("receive-payment", payload, true, "verified");
  res.status(200).json({ received: true });
}

export default withMonoovaVerify(handler);