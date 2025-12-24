// pages/api/webhooks/replay.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prismaLive, prismaSandbox } from "@/lib/prisma";

/**
 * WHY: Node's fetch() needs an absolute URL. We construct origin from headers,
 * load the stored event (we try SANDBOX then LIVE), map kind -> handler path,
 * and then POST the saved payload to that absolute internal URL.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const id =
      (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id) ||
      (req.body && (req.body as any).id);
    if (!id) return res.status(400).json({ error: "id is required" });

    // Find the event (try SANDBOX first, then LIVE)
    const ev =
      (await prismaSandbox.webhookEvent.findUnique({ where: { id } })) ||
      (await prismaLive.webhookEvent.findUnique({ where: { id } }));

    if (!ev) return res.status(404).json({ error: "not found" });

    // Map kind -> handler path
    const path = routeForKind(ev.kind);
    if (!path) {
      return res.status(200).json({
        replayed: false,
        reason: `no route for kind: ${ev.kind}`,
      });
    }

    // Build absolute URL from the incoming request
    const proto = (req.headers["x-forwarded-proto"] as string) || "http";
    const host = req.headers.host;
    if (!host) return res.status(500).json({ error: "Host header missing" });

    const url = `${proto}://${host}${path}`;

    const forward = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Optional: flag to let handlers know this is a replay
        "x-webhook-replay": "true",
      },
      body: JSON.stringify(ev.payload ?? {}),
    });

    const text = await forward.text();
    let body: any;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    return res.status(200).json({
      replayed: true,
      forwardedTo: path,
      status: forward.status,
      body,
    });
  } catch (e: any) {
    return res.status(500).json({ replayed: false, error: e?.message || String(e) });
  }
}

function routeForKind(kind: string): string | null {
  const k = String(kind || "").toLowerCase();

  // --- Notification Management kinds (extend if you add more dedicated handlers) ---
  if (k === "paymentagreementnotification") return "/api/webhooks/monoova/receive-payment";
  if (k === "paymentinstructionnotification") return "/api/webhooks/monoova/receive-payment";
  if (k === "creditcardpaymentnotification") return "/api/webhooks/monoova/receive-payment";
  if (k === "creditcardrefundnotification") return "/api/webhooks/monoova/receive-payment";
  if (k === "asyncjobresultnotification") return "/api/webhooks/monoova/receive-payment";

  // --- Legacy kinds (aliases included) ---
  if (k === "npppaymentstatus") return "/api/webhooks/monoova/npp-payment-status";
  if (k === "nppreturn") return "/api/webhooks/monoova/npp-payment-return";
  if (k === "inbounddirectcredit") return "/api/webhooks/monoova/inbound-direct-credit";
  if (k === "inbounddirectdebit") return "/api/webhooks/monoova/inbound-direct-debit";
  if (k === "directentrydishonour") return "/api/webhooks/monoova/direct-entry-dishonours";

  // RTGS/IMT status comes through with different keys at times; support both
  if (k === "inboundrtgsimtstatus" || k === "rtgsimtstatus") return "/api/webhooks/monoova/rtgs-imt-status";

  // Generic receive-payment style payloads
  if (k === "nppreceivepayment" || k === "paytoreceivepayment" || k === "receivepayment") {
    return "/api/webhooks/monoova/receive-payment";
  }

  return null;
}
