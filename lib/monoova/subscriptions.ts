// lib/monoova/subscriptions.ts
import type { RequestInit } from "node-fetch";

export type MonoovaEnv = "sandbox" | "live";
export type MonoovaService = "notification" | "legacy";

export type SubscriptionRow = {
  service: MonoovaService;
  subscriptionId: string;
  subscriptionName?: string;
  eventName: string;
  callbackUrl: string;
  isActive: boolean;
  emailTo?: string[];
  emailBcc?: string[];
};

export type CreateUpdatePayload = {
  // legacy ignores subscriptionName/isActive/emailTo/emailBcc, but we keep fields
  // so the rest of the UI can pass a single payload type.
  subscriptionName?: string;
  eventName: string;
  callbackUrl: string;
  isActive?: boolean;
  emailTo?: string[];
  emailBcc?: string[];
};

const reqd = (k: string, v?: string) => {
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
};

function basic(env: MonoovaEnv) {
  // Monoova Payments API (legacy): Basic auth = username(mAccount) : password(API key)
  const user =
    env === "sandbox"
      ? reqd("SANDBOX_MACCOUNT", process.env.SANDBOX_MACCOUNT)
      : reqd("LIVE_MACCOUNT", process.env.LIVE_MACCOUNT);

  const pass =
    env === "sandbox"
      ? reqd("MONOOVA_API_KEY_SANDBOX", process.env.MONOOVA_API_KEY_SANDBOX)
      : reqd("MONOOVA_API_KEY_LIVE", process.env.MONOOVA_API_KEY_LIVE);

  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

function baseLegacy(env: MonoovaEnv) {
  // Payments API base URLs (from docs):
  // sandbox: https://api.m-pay.com.au
  // live:    https://api.mpay.com.au
  return env === "sandbox"
    ? reqd("MONOOVA_BASE_SANDBOX", process.env.MONOOVA_BASE_SANDBOX)
    : reqd("MONOOVA_BASE_LIVE", process.env.MONOOVA_BASE_LIVE);
}

// We keep the function name for compatibility, but NM is disabled in this project.
function nmDisabled<T = never>(): T {
  throw new Error(
    "Notification Management API is not enabled in this project. Use Payments API (legacy) endpoints only."
  );
}

type CallInit = RequestInit & {
  searchParams?: Record<string, string>;
  timeoutMs?: number;
};

async function callLegacy(env: MonoovaEnv, path: string, init: CallInit = {}) {
  const root = `${baseLegacy(env)}/subscriptions/v1`;
  const url = new URL(path.startsWith("http") ? path : `${root}${path}`);

  if (init.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) url.searchParams.set(k, v);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 20000);

  try {
    const res = await fetch(url.toString(), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: basic(env),
        ...(init.headers || {}),
      },
      signal: controller.signal,
    } as any);

    const text = await res.text();
    let body: any;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }

    if (!res.ok) {
      // surface upstream body for easier debugging
      throw new Error(
        `Monoova legacy ${res.status} ${res.statusText} – ${
          typeof body === "string" ? body : JSON.stringify(body)
        }`
      );
    }
    return body;
  } catch (err: any) {
    const hint =
      err?.name === "AbortError"
        ? "request timed out"
        : err?.cause?.code || err?.message || String(err);
    throw new Error(`Network error calling ${url.hostname}: ${hint}`);
  } finally {
    clearTimeout(timeout);
  }
}

/** LIST */
export async function listSubscriptions(
  service: MonoovaService,
  env: MonoovaEnv
): Promise<SubscriptionRow[]> {
  if (service === "notification") return nmDisabled();

  const data = await callLegacy(env, "/list", { method: "GET" });
  const events = (data?.eventname ?? []) as any[];

  return events.map((e) => ({
    service: "legacy",
    subscriptionId: String(e.id ?? ""),
    subscriptionName: e.eventname ?? "",
    eventName: e.eventname ?? "",
    callbackUrl: e.targeturl ?? "",
    isActive: String(e.status ?? "").toLowerCase() === "active",
  }));
}

/** GET BY ID (legacy via list+filter) */
export async function getSubscription(
  service: MonoovaService,
  env: MonoovaEnv,
  id: string
): Promise<SubscriptionRow | null> {
  if (!id) return null;
  if (service === "notification") return nmDisabled();

  const all = await listSubscriptions("legacy", env);
  return all.find((x) => x.subscriptionId === id) ?? null;
}

/** CREATE (supports Idempotency-Key header pass-through) */
export async function createSubscription(
  service: MonoovaService,
  env: MonoovaEnv,
  p: CreateUpdatePayload,
  opts?: { idempotencyKey?: string }
) {
  if (service === "notification") return nmDisabled();

  const body = { eventname: p.eventName, targeturl: p.callbackUrl };
  const res = await callLegacy(env, "/create", {
    method: "POST",
    body: JSON.stringify(body),
    headers: opts?.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : undefined,
  });
  return { subscriptionId: String(res?.id ?? "") };
}

/** UPDATE (supports Idempotency-Key) */
export async function updateSubscription(
  service: MonoovaService,
  env: MonoovaEnv,
  id: string,
  p: CreateUpdatePayload,
  opts?: { idempotencyKey?: string }
) {
  if (service === "notification") return nmDisabled();

  const body = { id, eventname: p.eventName, targeturl: p.callbackUrl };
  const res = await callLegacy(env, "/update", {
    method: "POST",
    body: JSON.stringify(body),
    headers: opts?.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : undefined,
  });
  return { subscriptionId: String(res?.id ?? id) };
}

/** DELETE */
export async function deleteSubscription(
  service: MonoovaService,
  env: MonoovaEnv,
  id: string
) {
  if (service === "notification") return nmDisabled();
  await callLegacy(env, `/delete/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Legacy-only helpers */
export async function resendLegacy(env: MonoovaEnv, webhookId: string) {
  // v2 endpoint lives under /subscriptions/v2; build absolute then strip the v1 prefix for callLegacy
  const full = `${baseLegacy(env)}/subscriptions/v2/resend/${encodeURIComponent(webhookId)}`;
  const v1root = `${baseLegacy(env)}/subscriptions/v1`;
  return callLegacy(env, full.replace(v1root, ""), { method: "POST" });
}

export async function reportLegacy(env: MonoovaEnv, ymd: string) {
  return callLegacy(env, `/report/${encodeURIComponent(ymd)}`, { method: "GET" });
}
