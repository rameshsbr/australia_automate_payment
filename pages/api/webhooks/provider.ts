// pages/api/webhooks/provider.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { env } from "@/lib/env";
import * as PrismaExport from "@/lib/prisma";
import { rateLimit, keyFor } from "@/lib/rate-limit";
import { logEvent, logWarn, logError } from "@/lib/obs";

export const config = { api: { bodyParser: false } };

// tolerant prisma import (default or named)
const prisma: any = (PrismaExport as any).default ?? (PrismaExport as any).prisma ?? null;

// ---------- utility ----------
function readRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

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

// in pages/api/webhooks/provider.ts
function readSig(req: NextApiRequest): string | null {
  const pick = (h: string | string[] | undefined) =>
    (Array.isArray(h) ? h[0] : h)?.trim().replace(/^"+|"+$/g, "") || null;
  // accept both our dev header and Monoova’s name
  return (
    pick(req.headers["x-webhook-signature"]) ||
    pick(req.headers["x-monoova-signature"])
  );
}

function verifySharedSecret(req: NextApiRequest): boolean {
  const sig = readSig(req);
  const expected = (process.env.WEBHOOK_SECRET || "").trim().replace(/^"+|"+$/g, "");
  if (!expected) return false;
  return sig === expected;
}

function clientIp(req: NextApiRequest): string {
  const xff = (req.headers["x-forwarded-for"] as string) || "";
  return xff.split(",")[0]?.trim() || (req.socket as any)?.remoteAddress || "unknown";
}

function originFrom(req: NextApiRequest): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  const host = req.headers.host || "localhost:3000";
  return `${proto}://${host}`;
}

// fan-out to a specific monoova sub-handler (best effort; non-blocking)
async function fanOut(req: NextApiRequest, kind: string, payload: any) {
  const routeMap: Record<string, string> = {
    npppaymentstatus: "/api/webhooks/monoova/npp-payment-status",
    nppreturn: "/api/webhooks/monoova/npp-payment-return",
    inbounddirectcredit: "/api/webhooks/monoova/inbound-direct-credit",
    inbounddirectdebit: "/api/webhooks/monoova/inbound-direct-debit",
    directentrydishonour: "/api/webhooks/monoova/direct-entry-dishonours",
    rtgsimtstatus: "/api/webhooks/monoova/rtgs-imt-status",
    receivepayment: "/api/webhooks/monoova/receive-payment",
    paytoreceivepayment: "/api/webhooks/monoova/receive-payment",
  };
  const path = routeMap[kind?.toLowerCase()];
  if (!path) return;

  const url = `${originFrom(req)}${path}`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    } as any);
  } catch (e) {
    logWarn("webhook_fanout_failed", { kind, error: (e as any)?.message || String(e) });
  }
}

// ---------- handler ----------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // rate limit (60/min per IP per route)
  const r = rateLimit(keyFor(clientIp(req), req.url || "/api/webhooks/provider"), 60, 60_000);
  if (!r.ok) {
    res.setHeader("Retry-After", String(r.retryAfterSec));
    return res.status(429).json({ error: "Too many requests, slow down." });
  }

  // content-type sanity (allow missing for old senders)
  const ct = (req.headers["content-type"] || "").toString().toLowerCase();
  if (ct && !ct.includes("application/json")) {
    return res.status(415).json({ error: "Content-Type must be application/json" });
  }

  // raw read
  let raw: Buffer;
  try {
    raw = await readRawBody(req);
  } catch (e: any) {
    return res.status(400).json({ error: `Failed to read body: ${e?.message || e}` });
  }

  // verify shared secret
  if (!verifySharedSecret(req)) {
    logWarn("webhook_bad_secret", { ip: clientIp(req) });
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  // parse JSON (fallback to base64 if non-JSON)
  let payload: any = null;
  try {
    const text = raw.toString("utf8").trim();
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: raw.toString("base64") };
  }

  const kind =
    String((payload && (payload.type || payload.event || payload.kind)) ??
      req.headers["x-monoova-event"] ??
      "unknown").toLowerCase();

  // fingerprint for dedupe
  const fp = fingerprint(raw, req.headers);
  const fpNote = `fp:${fp}`;

  // dedupe check
  if (prisma) {
    try {
      const dup = await prisma.webhookEvent.findFirst({
        where: { note: { contains: fp } },
        orderBy: { receivedAt: "desc" },
      });
      if (dup) {
        logEvent("webhook_duplicate", { kind, duplicateOf: dup.id });
        return res.status(200).json({ received: true, duplicateOf: dup.id });
      }
    } catch (e) {
      logWarn("webhook_dedupe_error", { error: (e as any)?.message || String(e) });
    }
  }

  // persist
  let id: string | undefined;
  if (prisma) {
    try {
      const created = await prisma.webhookEvent.create({
        data: {
          kind,
          verified: true,
          payload: payload as any,
          note: fpNote,
        },
        select: { id: true },
      });
      id = created?.id;
    } catch (e: any) {
      logError("webhook_persist_failed", { error: e?.message || e });
      return res.status(500).json({ error: `DB insert failed: ${e?.message || e}` });
    }
  }

  logEvent("webhook_received", { kind, id, ip: clientIp(req) });

  // non-blocking fan-out
  fanOut(req, kind, payload).catch(() => {});

  return res.status(200).json({ received: true, id, kind });
}