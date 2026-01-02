// lib/monoova/security.ts
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
  CREATE_TOKEN: process.env.MONOOVA_PATH_SECURITY_CREATE_TOKEN ?? "/maccount/v1/createSecurityToken",
  CHANGE_PW: process.env.MONOOVA_PATH_SECURITY_CHANGE_PW ?? "/security/v1/changePassword",
  SIGNIN_SETTINGS: process.env.MONOOVA_PATH_SECURITY_SIGNIN_SETTINGS ?? "/security/v1/signInAccountSettings",
};

export async function monoovaCreateSecurityToken(env: Env) {
  // GET – returns a short-lived token for privileged endpoints
  return await call(env, PATHS.CREATE_TOKEN, { method: "GET" });
}

export async function monoovaChangePassword(env: Env, payload: { oldPassword: string; newPassword: string }) {
  return await call(env, PATHS.CHANGE_PW, { method: "POST", body: JSON.stringify(payload) });
}

export async function monoovaGetSignInAccountSettings(env: Env) {
  return await call(env, PATHS.SIGNIN_SETTINGS, { method: "GET" });
}