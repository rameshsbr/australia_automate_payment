// pages/api/webhooks/_monoova-verify.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import getRawBody from "raw-body";
import { verifyMonoovaWebhookRaw } from "../../../lib/monoova/crypto";

export const config = {
  api: { bodyParser: false }, // IMPORTANT: we need the raw body
};

export type MonoovaWebhookRequest = NextApiRequest & {
  rawBody: Buffer;
  json?: any;
  monoovaPayload?: any;
};

// pull a single string value from header variants
function firstHeaderVal(v: string | string[] | undefined) {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

// create a header map that includes a canonical signature key
function normalizeSignatureHeaders(
  headers: NextApiRequest["headers"]
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (v == null) continue;
    out[k.toLowerCase()] = firstHeaderVal(v) as string;
  }

  // look for any common variants
  const candidates = [
    "verification-signature",
    "verification_signature",
    "verificationsignature",
    "x-verification-signature",
    "x_verification_signature",
    "xverificationsignature",
    "monoova-signature",
    "x-monoova-signature",
    "signature",
  ];

  let sig: string | undefined;
  for (const k of candidates) {
    const v = out[k];
    if (v && String(v).trim()) {
      sig = String(v).trim();
      break;
    }
  }

  if (sig) {
    // ensure your crypto helper sees a predictable key name,
    // and also include a couple of aliases just in case.
    out["verification-signature"] = sig;
    out["verification_signature"] = sig;
    out["verificationsignature"] = sig;
  }

  return out;
}

export function withMonoovaVerify(handler: NextApiHandler): NextApiHandler {
  return async (req: MonoovaWebhookRequest, res: NextApiResponse) => {
    // 1) read raw body safely once
    try {
      req.rawBody = await getRawBody(req, { encoding: null });
    } catch {
      return res.status(400).json({ ok: false, error: "unable to read raw body" });
    }

    // 2) verify signature (with normalized headers)
    const normHeaders = normalizeSignatureHeaders(req.headers);
    const verified = await verifyMonoovaWebhookRaw(req.rawBody, normHeaders, req);
    if (!verified?.ok) {
      return res.status(401).json({ ok: false, error: verified?.reason || "unauthorized" });
    }

    // 3) parse JSON body for your handler’s convenience
    try {
      const text = req.rawBody.toString("utf8");
      const parsed = text ? JSON.parse(text) : undefined;
      req.json = parsed;
      req.monoovaPayload = parsed;       // your handlers already look for this
      (req as any).body = parsed;        // keep legacy fallbacks working
    } catch {
      // some Monoova callbacks may not be JSON; leave undefined
    }

    // 4) call the real handler
    return handler(req, res);
  };
}