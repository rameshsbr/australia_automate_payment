// pages/api/webhooks/monoova/npp-payment-status.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { recordWebhook } from "@/lib/monoova/webhooks";
import { logEvent } from "@/lib/obs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

  // very light shape check; keep lenient so sandbox/dev payloads pass
  const kind = String(payload?.type ?? payload?.event ?? "npppaymentstatus").toLowerCase();
  logEvent("monoova_npp_status_in", { kind });

  await recordWebhook("npp-payment-status", payload, false, "unverified");
  res.status(200).json({ received: true });
}
