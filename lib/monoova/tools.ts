// lib/monoova/tools.ts
import type { Env } from "./maccount";

// --- shared bits (mirrors security.ts style) ---
const reqd = (k: string, v?: string) => { if (!v) throw new Error(`Missing env: ${k}`); return v; };

function base(env: Env) {
  return env === "sandbox"
    ? reqd("MONOOVA_BASE_SANDBOX", process.env.MONOOVA_BASE_SANDBOX)
    : reqd("MONOOVA_BASE_LIVE", process.env.MONOOVA_BASE_LIVE);
}

function basic(env: Env) {
  const user = env === "sandbox" ? reqd("SANDBOX_MACCOUNT", process.env.SANDBOX_MACCOUNT) : reqd("LIVE_MACCOUNT", process.env.LIVE_MACCOUNT);
  const pass = env === "sandbox" ? reqd("MONOOVA_API_KEY_SANDBOX", process.env.MONOOVA_API_KEY_SANDBOX) : reqd("MONOOVA_API_KEY_LIVE", process.env.MONOOVA_API_KEY_LIVE);
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

async function call(env: Env, path: string, init: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${base(env)}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: basic(env), ...(init.headers as any) },
  } as any);
  const text = await res.text();
  let body: any; try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }
  if (!res.ok) throw new Error(`Upstream ${res.status} ${res.statusText}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  return body;
}

// --- Tools paths (override via .env if your tenant differs) ---
const PATHS = {
  TOOLS_PING: process.env.MONOOVA_PATH_TOOLS_PING ?? "/tools/v1/ping",
  TOOLS_ABN: process.env.MONOOVA_PATH_TOOLS_VALIDATE_ABN ?? "/tools/v1/abnvalidate/{abnnumber}",
  TOOLS_BSB: process.env.MONOOVA_PATH_TOOLS_VALIDATE_BSB ?? "/tools/v1/bsbvalidate/{bsbnumber}",
  TOOLS_EMAIL_ISSUER: process.env.MONOOVA_PATH_TOOLS_EMAIL_ISSUER ?? "/tools/v1/sendemailtoissuer",
};

// --- Exports ---
export async function monoovaToolsPing(env: Env) {
  return await call(env, PATHS.TOOLS_PING, { method: "GET" });
}

export async function monoovaValidateAbn(env: Env, abn: string) {
  const path = PATHS.TOOLS_ABN.replace("{abnnumber}", encodeURIComponent(String(abn)));
  return await call(env, path, { method: "GET" });
}

export async function monoovaValidateBsb(env: Env, bsb: string) {
  const path = PATHS.TOOLS_BSB.replace("{bsbnumber}", encodeURIComponent(String(bsb)));
  return await call(env, path, { method: "GET" });
}

/**
 * Docs show an empty POST payload; keep it flexible (pass-through body if provided).
 * If your tenant needs fields later, you can extend `payload`.
 */
export async function monoovaEmailIssuer(env: Env, payload?: any) {
  const hasBody = payload && Object.keys(payload).length > 0;
  return await call(env, PATHS.TOOLS_EMAIL_ISSUER, {
    method: "POST",
    ...(hasBody ? { body: JSON.stringify(payload) } : {}),
  });
}