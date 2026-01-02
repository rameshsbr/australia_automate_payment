// lib/monoova/public.ts
import type { Env } from "./maccount";

const reqd = (k: string, v?: string) => { if (!v) throw new Error(`Missing env: ${k}`); return v; };

function base(env: Env) {
  return env === "sandbox"
    ? reqd("MONOOVA_BASE_SANDBOX", process.env.MONOOVA_BASE_SANDBOX)
    : reqd("MONOOVA_BASE_LIVE", process.env.MONOOVA_BASE_LIVE);
}

// Public endpoints: NO Authorization header
async function callPublic(env: Env, path: string, init: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${base(env)}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers as any),
    },
  } as any);
  const text = await res.text();
  let body: any; try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }
  if (!res.ok) throw new Error(`Upstream ${res.status} ${res.statusText}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  return body;
}

const PATHS = {
  PING: process.env.MONOOVA_PATH_PUBLIC_PING ?? "/public/ping",
};

export async function monoovaPublicPing(env: Env) {
  // Most providers return something like { status: "OK", ... }
  return await callPublic(env, PATHS.PING, { method: "GET" });
}