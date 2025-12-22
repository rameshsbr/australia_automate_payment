// lib/monoova.ts
// Centralised Monoova config + auth helpers

import { cookies } from "next/headers";

export type MonoovaEnv = "SANDBOX" | "LIVE";
export type Mode = MonoovaEnv;

export type MonoovaCfg = {
  base: string;
  apiKey: string;
  mAccount: string;
};

/**
 * Prefer MONOOVA_* envs; fall back to legacy SANDBOX_* / LIVE_*.
 */
export const monoovaConfig = (mode: Mode): MonoovaCfg => {
  const isLive = mode === "LIVE";

  const base =
    (isLive
      ? process.env.MONOOVA_BASE_LIVE || process.env.LIVE_API_BASE
      : process.env.MONOOVA_BASE_SANDBOX || process.env.SANDBOX_API_BASE) ||
    (isLive ? "https://api.mpay.com.au" : "https://api.m-pay.com.au");

  const apiKey =
    (isLive
      ? process.env.MONOOVA_API_KEY_LIVE || process.env.LIVE_API_KEY
      : process.env.MONOOVA_API_KEY_SANDBOX || process.env.SANDBOX_API_KEY) || "";

  const mAccount =
    (isLive ? process.env.LIVE_MACCOUNT : process.env.SANDBOX_MACCOUNT) || "";

  return { base, apiKey, mAccount };
};

export const basicForApiKey = (apiKey: string) =>
  "Basic " + Buffer.from(`${apiKey}:`).toString("base64");

/**
 * Some token endpoints expect Basic <base64(mAccount:apiKey)>
 */
export const basicForTokenEndpoint = (mAccount: string, apiKey: string) =>
  "Basic " + Buffer.from(`${mAccount}:${apiKey}`).toString("base64");

// Simple in-memory bearer cache per environment
const tokenCache: Record<Mode, { token: string; exp: number } | undefined> = {
  SANDBOX: undefined,
  LIVE: undefined,
};

// Allow override if tenant differs; default from docs
const TOKEN_PATH = process.env.MONOOVA_TOKEN_PATH || "authorisation/token";

/**
 * Fetch Bearer for PayTo / Cards families when required.
 */
export async function getBearerToken(mode: Mode): Promise<string> {
  const now = Date.now();
  const cached = tokenCache[mode];
  if (cached && cached.exp > now + 15_000) return cached.token;

  const cfg = monoovaConfig(mode);
  if (!cfg.apiKey || !cfg.mAccount) {
    throw new Error(`Missing API key or mAccount for ${mode}.`);
  }

  const res = await fetch(`${cfg.base}/${TOKEN_PATH}`, {
    method: "POST",
    headers: {
      Authorization: basicForTokenEndpoint(cfg.mAccount, cfg.apiKey),
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });

  if (!res.ok) throw new Error(`Token fetch failed (${res.status})`);
  const data = await res.json();

  const token = data.access_token || data.token;
  if (!token) throw new Error("Token response missing access token");

  const ttlSec = Number(data.expires_in ?? 1800);
  const exp = now + Math.max(60_000, ttlSec * 1000 - 60_000); // cache with 60s headroom
  tokenCache[mode] = { token, exp };
  return token;
}

/**
 * Choose Authorization per-path:
 *  - Bearer for payto/* and cards/* families
 *  - Basic <API_KEY:> for everything else
 *  - For token endpoints themselves, Basic <mAccount:API_KEY>
 */
export async function authHeaderForPath(path: string, mode: Mode): Promise<string> {
  const p = (path || "").toLowerCase();
  const cfg = monoovaConfig(mode);

  if (!cfg.apiKey) throw new Error(`Missing API key for ${mode}.`);

  if (p.startsWith("payto") || p.startsWith("cards")) {
    const bearer = await getBearerToken(mode);
    return `Bearer ${bearer}`;
  }

  if (p.startsWith("authorisation") || p.startsWith("authorization")) {
    if (!cfg.mAccount) throw new Error(`Missing mAccount for ${mode}.`);
    return basicForTokenEndpoint(cfg.mAccount, cfg.apiKey);
  }

  return basicForApiKey(cfg.apiKey);
}

/**
 * Base URL according to 'env' cookie (defaults SANDBOX).
 * Uses the same resolution logic as monoovaConfig.
 */
export function monoovaBase(): string {
  let envCookie: string | undefined;
  try {
    envCookie = cookies().get("env")?.value?.toUpperCase();
  } catch {
    envCookie = undefined;
  }
  const mode: Mode = envCookie === "LIVE" ? "LIVE" : "SANDBOX";
  return monoovaConfig(mode).base;
}

/**
 * Minimal server fetch helper (no auth by default).
 * Callers should pass Authorization in init.headers when needed.
 */
export async function monoovaFetch<T>(
  path: string,
  init: RequestInit & { body?: any } = {}
): Promise<T> {
  const base = monoovaBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers,
    body:
      init.method && init.method.toUpperCase() !== "GET" && init.body !== undefined
        ? typeof init.body === "string"
          ? init.body
          : JSON.stringify(init.body)
        : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!res.ok) (json as any)._httpStatus = res.status;
    return json as T;
  } catch {
    // Non-JSON body; return as-is in a wrapper
    return { _raw: text, _httpStatus: res.status } as unknown as T;
  }
}