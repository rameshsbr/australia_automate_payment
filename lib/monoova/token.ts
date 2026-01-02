// lib/monoova/token.ts
import type { Env } from "./maccount";

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

const PATHS = {
  CREATE_AU_BANK: process.env.MONOOVA_PATH_TOKEN_CREATE_AU_BANK ?? "/token/v1/createAustralianBankAccount",
  LIST: (m: string) => (process.env.MONOOVA_PATH_TOKEN_LIST ?? "/token/v1/list/{mAccount}").replace("{mAccount}", encodeURIComponent(m)),
  GET:  (t: string) => (process.env.MONOOVA_PATH_TOKEN_GET ?? "/token/v1/get/{token}").replace("{token}", encodeURIComponent(t)),
  DELETE_TMPL: process.env.MONOOVA_PATH_TOKEN_DELETE ?? "/token/v1/delete/{token}",
  UPDATE: process.env.MONOOVA_PATH_TOKEN_UPDATE ?? "/token/v1/update",
  VALIDATE: process.env.MONOOVA_PATH_TOKEN_VALIDATE ?? "/token/v1/validate",
};

export async function monoovaCreateBankAccountToken(env: Env, payload: {
  bsb: string; accountNumber: string; accountName?: string; nickname?: string;
}) {
  const data = await call(env, PATHS.CREATE_AU_BANK, { method: "POST", body: JSON.stringify(payload) });
  return { raw: data };
}

export async function monoovaListTokens(env: Env, mAccount: string) {
  const data = await call(env, PATHS.LIST(mAccount), { method: "GET" });
  const items = Array.isArray(data?.tokens) ? data.tokens : (Array.isArray(data) ? data : []);
  return items.map((t: any) => ({
    token: String(t?.token ?? t?.id ?? ""),
    type: t?.type ?? t?.tokentype ?? "",
    createdAt: t?.createdAt ?? t?.createdDate ?? null,
    nickname: t?.nickname ?? t?.name ?? "",
    raw: t,
  })).filter(x => x.token);
}

export async function monoovaGetTokenDetails(env: Env, token: string) {
  const data = await call(env, PATHS.GET(token), { method: "GET" });
  return { token, raw: data };
}

export async function monoovaDeleteToken(env: Env, token: string) {
  // Support either GET with path placeholder or POST with body, depending on tenant
  const tmpl = PATHS.DELETE_TMPL;
  if (tmpl.includes("{token}")) {
    const path = tmpl.replace("{token}", encodeURIComponent(token));
    const data = await call(env, path, { method: "GET" });
    return { deleted: true, raw: data };
  } else {
    const data = await call(env, tmpl, { method: "POST", body: JSON.stringify({ token }) });
    return { deleted: true, raw: data };
  }
}

export async function monoovaUpdateToken(env: Env, token: string, payload: any) {
  // Commonly used to update nickname/metadata; POST is typical
  const body = { token, ...payload };
  const data = await call(env, PATHS.UPDATE, { method: "POST", body: JSON.stringify(body) });
  return { raw: data };
}

export async function monoovaValidateToken(env: Env, payload: any) {
  // Accept any documented/tenant fields; pass-through
  const data = await call(env, PATHS.VALIDATE, { method: "POST", body: JSON.stringify(payload) });
  return { valid: !!data?.valid || data?.status === "OK", raw: data };
}