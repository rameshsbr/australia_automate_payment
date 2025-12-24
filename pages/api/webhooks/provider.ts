// pages/api/webhooks/provider.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/lib/env";
import * as PrismaExport from "@/lib/prisma";
import crypto from "crypto";

export const config = { api: { bodyParser: false } };

// tolerant prisma import (default or named)
const prisma: any = (PrismaExport as any).default ?? (PrismaExport as any).prisma ?? null;

// minimal raw-body reader
function readRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// derive a stable fingerprint from raw bytes + a few headers
function fingerprint(buf: Buffer, headers: NextApiRequest["headers"]): string {
  const hParts = [
    String(headers["x-request-id"] ?? ""),
    String(headers["x-monoova-event"] ?? ""),
    String(headers["x-monoova-signature"] ?? ""),
  ].join("|");
  const h = crypto.createHash("sha256");
  h.update(buf);
  h.update("|");
  h.update(hParts);
  return h.digest("hex");
}

// basic shared-secret verification (extend later if Monoova adds HMAC scheme)
function verifySharedSecret(req: NextApiRequest): boolean {
  const sig = (Array.isArray(req.headers["x-webhook-signature"])
    ? req.headers["x-webhook-signature"][0]
    : req.headers["x-webhook-signature"])?.trim();
  if (!env.webhookSecret) return false; // hard fail if not configured
  return sig === env.webhookSecret;
}

// optional fan-out to your monoova sub-handlers (best-effort)
async function fanOut(kind: string, payload: any) {
  // Map kinds to existing handlers under /api/webhooks/monoova/*
  // If your payload uses other keys, adjust here.
  const routeMap: Record<string, string> = {
    // examples – extend as needed
    npppaymentstatus: "/api/webhooks/monoova/npp-payment-status",
    nppreturn: "/api/webhooks/monoova/npp-payment-return",
    inbounddirectcredit: "/api/webhooks/monoova/inbound-direct-credit",
    inbounddirectdebit: "/api/webhooks/monoova/inbound-direct-debit",
    directentrydishonour: "/api/webhooks/monoova/direct-entry-dishonours",
    rtgsimtstatus: "/api/webhooks/monoova/rtgs-imt-status",
    receivepayment: "/api/webhooks/monoova/receive-payment",
  };
  const path = routeMap[kind?.toLowerCase()] ?? null;
  if (!path) return;

  // internal call; no secret required
  try {
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Why: your sub-handlers live under /pages/api/webhooks/monoova/*
      body: JSON.stringify(payload ?? {}),
    } as any);
  } catch {
    // swallow: main ingress should still 200 after persistence
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // 1) raw read
  let raw: Buffer;
  try {
    raw = await readRawBody(req);
  } catch (e: any) {
    return res.status(400).json({ error: `Failed to read body: ${e?.message || e}` });
  }

  // 2) verify shared secret
  if (!verifySharedSecret(req)) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  // 3) parse JSON (allow text payloads too)
  let payload: any = null;
  try {
    const text = raw.toString("utf8").trim();
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: raw.toString("base64") }; // keep something if non-JSON
  }

  // 4) derive kind; prefer explicit field, fall back to header
  const kind =
    String((payload && (payload.type || payload.event || payload.kind)) ??
      req.headers["x-monoova-event"] ??
      "unknown").toLowerCase();

  // 5) compute fingerprint and dedupe
  const fp = fingerprint(raw, req.headers);
  const fpNote = `fp:${fp}`;

  if (prisma) {
    try {
      // check if we already stored this fingerprint recently
      const dup = await prisma.webhookEvent.findFirst({
        where: { note: { contains: fp } },
        orderBy: { receivedAt: "desc" },
      });
      if (dup) {
        return res.status(200).json({ received: true, duplicateOf: dup.id });
      }
    } catch {
      // ignore dedupe errors
    }
  }

  // 6) persist
  let id: string | undefined;
  if (prisma) {
    try {
      const created = await prisma.webhookEvent.create({
        data: {
          kind,
          verified: true,
          payload: payload as any,
          note: fpNote, // stores fingerprint; also use for debugging
          // organizationId is optional in your schema; set later if you want
        },
        select: { id: true },
      });
      id = created?.id;
    } catch (e: any) {
      return res.status(500).json({ error: `DB insert failed: ${e?.message || e}` });
    }
  }

  // 7) best-effort fan-out (non-blocking for success)
  fanOut(kind, payload).catch(() => {});

  // 8) ack
  res.status(200).json({ received: true, id, kind });
}
