// lib/monoova/crypto.ts
import crypto, { createPublicKey, constants, KeyObject } from "crypto";
import type { NextApiRequest } from "next";

type Mode = "live" | "sandbox";

function resolveModeFromReq(req?: NextApiRequest): Mode {
  const q = String(req?.query?.env ?? "").toLowerCase();
  if (q === "live") return "live";
  if (q === "sandbox") return "sandbox";
  const c = String(req?.cookies?.env ?? "").toLowerCase();
  return c === "live" ? "live" : "sandbox";
}

function baseUrlForSelf() {
  const hinted = process.env.PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (hinted) return hinted.replace(/\/api\/v1$/, "");
  return "http://localhost:3000";
}

// Simple in-memory TTL cache
const cache: Record<string, { at: number; ttlMs: number; buf: Buffer }> = {};
function setCache(k: string, buf: Buffer, ttlMs = 10 * 60 * 1000) {
  cache[k] = { at: Date.now(), ttlMs, buf };
}
function getCache(k: string): Buffer | undefined {
  const hit = cache[k];
  if (!hit) return;
  if (Date.now() - hit.at > hit.ttlMs) return;
  return hit.buf;
}

// --- Public endpoints via your own API routes ---
async function fetchWebhookCertDER(mode: Mode): Promise<Buffer> {
  const ck = `monoova-cert-${mode}`;
  const c = getCache(ck);
  if (c) return c;

  const res = await fetch(
    `${baseUrlForSelf()}/api/monoova/public/webhook-cert?env=${mode}`,
    { cache: "no-store" }
  );
  if (!res.ok)
    throw new Error(`Failed to fetch webhook cert (${mode}): ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  setCache(ck, buf, 30 * 60 * 1000);
  return buf;
}

/**
 * Monoova's public-key endpoint can return:
 *  - Binary DER (SPKI or PKCS#1)
 *  - PEM text ("-----BEGIN ...")
 *  - HEX string of DER (e.g. "3082010A0282...")
 *
 * Normalize all to a Buffer that createPublicKey() can understand.
 */
async function fetchPublicKeyMaterial(mode: Mode): Promise<Buffer> {
  const ck = `monoova-pubkey-${mode}`;
  const c = getCache(ck);
  if (c) return c;

  const res = await fetch(
    `${baseUrlForSelf()}/api/monoova/public/public-key?env=${mode}`,
    { cache: "no-store" }
  );
  if (!res.ok)
    throw new Error(`Failed to fetch public key (${mode}): ${res.status}`);

  let raw = Buffer.from(await res.arrayBuffer());

  // If it looks like PEM, keep as-is.
  const asText = raw.toString("utf8").trim();
  if (asText.startsWith("-----BEGIN ")) {
    setCache(ck, raw, 30 * 60 * 1000);
    return raw;
  }

  // If it looks like pure HEX (common from Monoova), decode to DER.
  if (/^[0-9a-fA-F]+$/.test(asText) && asText.length % 2 === 0) {
    raw = Buffer.from(asText, "hex");
    setCache(ck, raw, 30 * 60 * 1000);
    return raw;
  }

  // Otherwise assume it's binary DER already.
  setCache(ck, raw, 30 * 60 * 1000);
  return raw;
}

// --- Helpers ---
function derToPem(der: Buffer, label: "CERTIFICATE" | "PUBLIC KEY") {
  const b64 = der.toString("base64").match(/.{1,64}/g)?.join("\n");
  return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----\n`;
}

// --- Convert DER/PEM → KeyObject ---
function certDerToPublicKey(certDer: Buffer): crypto.KeyObject {
  if (typeof (crypto as any).X509Certificate === "function") {
    try {
      const cert = new (crypto as any).X509Certificate(certDer);
      return cert.publicKey as KeyObject;
    } catch {
      // try PEM-wrap if DER parse failed
    }
  }
  const pem = derToPem(certDer, "CERTIFICATE");
  const cert = new (crypto as any).X509Certificate(pem);
  return cert.publicKey as KeyObject;
}

function publicDerToKeyObject(pubDerOrPem: Buffer): crypto.KeyObject {
  const asText = pubDerOrPem.toString("utf8").trim();
  if (asText.startsWith("-----BEGIN ")) {
    return createPublicKey(asText);
  }
  // Try SPKI DER first
  try {
    return createPublicKey({ key: pubDerOrPem, type: "spki", format: "der" as any });
  } catch {
    // Then PKCS#1 RSAPublicKey DER
    return createPublicKey({ key: pubDerOrPem, type: "pkcs1", format: "der" as any });
  }
}

// --- Webhook verification (RSA-SHA256 over RAW body) ---
export type VerifyHeaders = {
  "x-monoova-signature"?: string | string[];
  "x-signature"?: string | string[];
  "x-monoova-algorithm"?: string | string[];
  "x-signature-algorithm"?: string | string[];
  "x-monoova-timestamp"?: string | string[];
  "x-timestamp"?: string | string[];
  "verification-signature"?: string | string[];
  "verification_signature"?: string | string[];
  verificationsignature?: string | string[];
  "x-verification-signature"?: string | string[];
  "x_verification_signature"?: string | string[];
  xverificationsignature?: string | string[];
  "monoova-signature"?: string | string[];
  signature?: string | string[];
  "verification-algorithm"?: string | string[];
  algorithm?: string | string[];
  [k: string]: any;
};

function firstHeader(h?: string | string[]): string | undefined {
  if (!h) return;
  return Array.isArray(h) ? h[0] : h;
}

function getSignatureHeader(h: VerifyHeaders): string | undefined {
  const all: Record<string, string> = {};
  for (const [k, v] of Object.entries(h || {})) {
    if (v == null) continue;
    all[k.toLowerCase()] = firstHeader(v) || "";
  }
  const candidates = [
    "verification-signature",
    "verification_signature",
    "verificationsignature",
    "x-verification-signature",
    "x_verification_signature",
    "xverificationsignature",
    "x-monoova-signature",
    "x-signature",
    "monoova-signature",
    "signature",
  ];
  for (const name of candidates) {
    const val = all[name];
    if (val) return val.trim();
  }
  return undefined;
}

function parseSigToBuffer(sig: string): Buffer | undefined {
  const s = sig.trim();
  const isHex = /^[0-9a-f]+$/i.test(s) && s.length % 2 === 0;
  try {
    return isHex ? Buffer.from(s, "hex") : Buffer.from(s, "base64");
  } catch {
    return undefined;
  }
}

export async function verifyMonoovaWebhookRaw(
  rawBody: Buffer,
  headers: VerifyHeaders,
  modeOrReq?: Mode | NextApiRequest
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const mode = (typeof modeOrReq === "string" ? modeOrReq : resolveModeFromReq(modeOrReq)) as Mode;

  const sigStr = getSignatureHeader(headers);
  if (!sigStr) return { ok: false, reason: "missing signature header" };

  const sigBuf = parseSigToBuffer(sigStr);
  if (!sigBuf) return { ok: false, reason: "malformed signature" };

  // Optional timestamp freshness
  const ts =
    firstHeader(headers["x-monoova-timestamp"]) ||
    firstHeader(headers["x-timestamp"]);
  if (ts) {
    const n = Number(ts);
    if (!Number.isNaN(n)) {
      const skew = Math.abs(Date.now() - n);
      if (skew > 10 * 60 * 1000) {
        return { ok: false, reason: "timestamp too far from now" };
      }
    }
  }

  // Verify with public key inside Monoova's certificate
  let pubKey: crypto.KeyObject;
  try {
    const certDer = await fetchWebhookCertDER(mode);
    pubKey = certDerToPublicKey(certDer);
  } catch (e: any) {
    return {
      ok: false,
      reason: `certificate fetch/parse failed: ${e?.message || String(e)}`,
    };
  }

  try {
    const ok = crypto.verify("RSA-SHA256", rawBody, pubKey, sigBuf);
    return ok ? { ok: true } : { ok: false, reason: "invalid signature" };
  } catch (e: any) {
    return { ok: false, reason: `verify failed: ${e?.message || String(e)}` };
  }
}

// --- Client-side encryption for Security endpoints ---
export type RsaPadding = "pkcs1" | "oaep";

export async function encryptForMonoova(
  plaintext: Buffer | string,
  mode: Mode,
  paddingArg?: RsaPadding
): Promise<string> {
  const pubMaterial = await fetchPublicKeyMaterial(mode);
  const pub = publicDerToKeyObject(pubMaterial);

  const algo =
    (process.env.MONOOVA_RSA_ALGO || "").toLowerCase().trim() ||
    (process.env.MONOOVA_RSA_PADDING || "").toLowerCase().trim() ||
    (paddingArg || "pkcs1");

  const oaepHash =
    (process.env.MONOOVA_RSA_OAEP_HASH || "sha256").toLowerCase().trim();

  const padding =
    algo === "oaep"
      ? constants.RSA_PKCS1_OAEP_PADDING
      : constants.RSA_PKCS1_PADDING;

  const buf = Buffer.isBuffer(plaintext)
    ? plaintext
    : Buffer.from(String(plaintext), "utf8");

  const encrypted =
    padding === constants.RSA_PKCS1_OAEP_PADDING
      ? crypto.publicEncrypt({ key: pub, padding, oaepHash }, buf)
      : crypto.publicEncrypt({ key: pub, padding }, buf);

  return encrypted.toString("base64");
}

// Convenience: export PEMs if you need them for debugging
export async function webhookCertPEM(mode: Mode): Promise<string> {
  const der = await fetchWebhookCertDER(mode);
  return derToPem(der, "CERTIFICATE");
}

export async function publicKeyPEM(mode: Mode): Promise<string> {
  const mat = await fetchPublicKeyMaterial(mode);
  const keyObj = publicDerToKeyObject(mat);
  return keyObj.export({ type: "spki", format: "pem" }).toString();
}