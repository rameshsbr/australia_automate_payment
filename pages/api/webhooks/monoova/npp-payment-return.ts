import type { NextApiRequest, NextApiResponse } from "next";
import { recordWebhook } from "@/lib/monoova/webhooks";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  await recordWebhook("npp-payment-return", payload, false, "unverified");
  res.status(200).json({ received: true });
}
