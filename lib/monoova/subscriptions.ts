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
  // why: callers may want these in UI later; optional to avoid breaking list mapping
  emailTo?: string[];
  emailBcc?: string[];
};

export type CreateUpdatePayload = {
  subscriptionName?: string; // NM only
  eventName: string;
  callbackUrl: string;
  isActive?: boolean;       // NM only
  emailTo?: string[];       // NM optional
  emailBcc?: string[];      // NM optional
};

const reqd = (k: string, v?: string) => {
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
};

function basic(env: MonoovaEnv) {
  // why: Monoova Basic auth is username=mAccount, password=API key
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
  return env === "sandbox"
    ? reqd("MONOOVA_BASE_SANDBOX", process.env.MONOOVA_BASE_SANDBOX)
    : reqd("MONOOVA_BASE_LIVE", process.env.MONOOVA_BASE_LIVE);
}

function baseNotification(env: MonoovaEnv) {
  return env === "sandbox"
    ? reqd("MONOOVA_NOTIFICATION_BASE_SANDBOX", process.env.MONOOVA_NOTIFICATION_BASE_SANDBOX)
    : reqd("MONOOVA_NOTIFICATION_BASE_LIVE", process.env.MONOOVA_NOTIFICATION_BASE_LIVE);
}

type CallInit = RequestInit & {
  searchParams?: Record<string, string>;
  timeoutMs?: number;
};

async function call(
  service: MonoovaService,
  env: MonoovaEnv,
  path: string,
  init: CallInit = {}
) {
  const root =
    service === "notification" ? baseNotification(env) : `${baseLegacy(env)}/subscriptions/v1`;
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
      // why: surface upstream body for easier debugging
      throw new Error(
        `Monoova ${service} ${res.status} ${res.statusText} – ${typeof body === "string" ? body : JSON.stringify(body)}`
      );
    }
    return body;
  } catch (err: any) {
    const hint =
      err?.name === "AbortError" ? "request timed out" : (err?.cause?.code || err?.message || String(err));
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
  if (service === "notification") {
    const data = await call("notification", env, "/subscription", { method: "GET" });
    const items = (data?.subscriptiondetails ?? []) as any[];
    return items.map((s) => ({
      service,
      subscriptionId: String(s.subscriptionid ?? ""),
      subscriptionName: s.subscriptionname ?? "",
      eventName: s.eventname ?? "",
      callbackUrl: s.webhookdetail?.callbackurl ?? "",
      isActive: Boolean(s.isactive),
      emailTo: (s.emaildetail?.toaddress ?? []).map((x: any) => x?.address).filter(Boolean),
      emailBcc: (s.emaildetail?.bccaddress ?? []).map((x: any) => x?.address).filter(Boolean),
    }));
  }

  const data = await call("legacy", env, "/list", { method: "GET" });
  const events = (data?.eventname ?? []) as any[];
  return events.map((e) => ({
    service,
    subscriptionId: String(e.id ?? ""),
    subscriptionName: e.eventname ?? "",
    eventName: e.eventname ?? "",
    callbackUrl: e.targeturl ?? "",
    isActive: String(e.status ?? "").toLowerCase() === "active",
  }));
}

/** GET BY ID (NM native; Legacy via list+filter fallback) */
export async function getSubscription(
  service: MonoovaService,
  env: MonoovaEnv,
  id: string
): Promise<SubscriptionRow | null> {
  if (!id) return null;

  if (service === "notification") {
    const s = await call("notification", env, `/subscription/${encodeURIComponent(id)}`, {
      method: "GET",
    });
    if (!s) return null;
    return {
      service,
      subscriptionId: String(s.subscriptionid ?? id),
      subscriptionName: s.subscriptionname ?? "",
      eventName: s.eventname ?? "",
      callbackUrl: s.webhookdetail?.callbackurl ?? "",
      isActive: Boolean(s.isactive),
      emailTo: (s.emaildetail?.toaddress ?? []).map((x: any) => x?.address).filter(Boolean),
      emailBcc: (s.emaildetail?.bccaddress ?? []).map((x: any) => x?.address).filter(Boolean),
    };
  }

  // Legacy: no by-id endpoint in your current code; fallback to list+find
  const all = await listSubscriptions("legacy", env);
  return all.find((x) => x.subscriptionId === id) ?? null;
}

/** CREATE (supports Idempotency-Key) */
export async function createSubscription(
  service: MonoovaService,
  env: MonoovaEnv,
  p: CreateUpdatePayload,
  opts?: { idempotencyKey?: string }
) {
  if (service === "notification") {
    const body = {
      subscriptionname: p.subscriptionName ?? p.eventName,
      eventname: p.eventName,
      webhookdetail: { callbackurl: p.callbackUrl },
      isactive: p.isActive ?? true,
      ...(p.emailTo || p.emailBcc
        ? {
            emaildetail: {
              toaddress: (p.emailTo ?? []).map((address) => ({ address })),
              bccaddress: (p.emailBcc ?? []).map((address) => ({ address })),
            },
          }
        : {}),
    };
    const res = await call("notification", env, "/subscription", {
      method: "POST",
      body: JSON.stringify(body),
      headers: opts?.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : undefined,
    });
    return { subscriptionId: String(res?.subscriptionid ?? "") };
  }

  const body = { eventname: p.eventName, targeturl: p.callbackUrl };
  const res = await call("legacy", env, "/create", {
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
  if (service === "notification") {
    const body = {
      subscriptionname: p.subscriptionName ?? p.eventName,
      eventname: p.eventName,
      webhookdetail: { callbackurl: p.callbackUrl },
      isactive: p.isActive ?? true,
      ...(p.emailTo || p.emailBcc
        ? {
            emaildetail: {
              toaddress: (p.emailTo ?? []).map((address) => ({ address })),
              bccaddress: (p.emailBcc ?? []).map((address) => ({ address })),
            },
          }
        : {}),
    };
    const res = await call("notification", env, `/subscription/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: opts?.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : undefined,
    });
    return { subscriptionId: String(res?.subscriptionid ?? id) };
  }

  const body = { id, eventname: p.eventName, targeturl: p.callbackUrl };
  const res = await call("legacy", env, "/update", {
    method: "POST",
    body: JSON.stringify(body),
    headers: opts?.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : undefined,
  });
  return { subscriptionId: String(res?.id ?? id) };
}

/** DELETE */
export async function deleteSubscription(service: MonoovaService, env: MonoovaEnv, id: string) {
  if (service === "notification") {
    await call("notification", env, `/subscription/${encodeURIComponent(id)}`, { method: "DELETE" });
    return;
  }
  await call("legacy", env, `/delete/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---- Legacy-only helpers ----
export async function resendLegacy(env: MonoovaEnv, webhookId: string) {
  // v2 endpoint; build absolute then strip v1 prefix for `call`
  const full = `${baseLegacy(env)}/subscriptions/v2/resend/${encodeURIComponent(webhookId)}`;
  const v1root = `${baseLegacy(env)}/subscriptions/v1`;
  return call("legacy", env, full.replace(v1root, ""), { method: "POST" });
}

export async function reportLegacy(env: MonoovaEnv, ymd: string) {
  return call("legacy", env, `/report/${encodeURIComponent(ymd)}`, { method: "GET" });
}