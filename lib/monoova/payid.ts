// lib/monoova/payid.ts
import type { Env } from "./maccount";

const reqd = (k: string, v?: string) => { if (!v) throw new Error(`Missing env: ${k}`); return v; };

function base(env: Env) {
  return env === "sandbox"
    ? reqd("MONOOVA_BASE_SANDBOX", process.env.MONOOVA_BASE_SANDBOX)
    : reqd("MONOOVA_BASE_LIVE", process.env.MONOOVA_BASE_LIVE);
}

function basic(env: Env) {
  const user = env === "sandbox"
    ? reqd("SANDBOX_MACCOUNT", process.env.SANDBOX_MACCOUNT)
    : reqd("LIVE_MACCOUNT", process.env.LIVE_MACCOUNT);
  const pass = env === "sandbox"
    ? reqd("MONOOVA_API_KEY_SANDBOX", process.env.MONOOVA_API_KEY_SANDBOX)
    : reqd("MONOOVA_API_KEY_LIVE", process.env.MONOOVA_API_KEY_LIVE);
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

async function call(env: Env, path: string, init: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${base(env)}${path}`;

  // Optional: short-ish timeout so failures don’t hang forever
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 12000);

  try {
    const res = await fetch(url, {
      ...init,
      signal: ac.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: basic(env),
        ...(init.headers as any),
      },
    } as any);

    const text = await res.text();
    let body: any; try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }
    if (!res.ok) {
      throw new Error(`Upstream ${res.status} ${res.statusText}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
    }
    return body;
  } catch (err: any) {
    const code = err?.code || err?.cause?.code || "";
    const msg = err?.message || String(err);
    throw new Error(`fetch failed for ${url} ${code ? `(${code})` : ""}: ${msg}`);
  } finally {
    clearTimeout(t);
  }
}

// ---- Correct PayID paths (from OpenAPI) ----
const PATHS = {
  PAYID_ENQUIRY: process.env.MONOOVA_PATH_PAYID_ENQUIRY ?? "/receivables/v1/payid/payIdEnquiry",
  PAYID_REGISTER: process.env.MONOOVA_PATH_PAYID_REGISTER ?? "/receivables/v1/payid/registerpayid",
  PAYID_UPDATE_STATUS: process.env.MONOOVA_PATH_PAYID_UPDATE_STATUS ?? "/receivables/v1/payid/updatePayIdStatus",
  PAYID_UPDATE_NAME: process.env.MONOOVA_PATH_PAYID_UPDATE_NAME ?? "/receivables/v1/payid/updatePayIdName",
};

// ---- API wrappers ----
export async function payIdEnquiry(env: Env, payId: string) {
  return await call(env, PATHS.PAYID_ENQUIRY, { method: "POST", body: JSON.stringify({ payId }) });
}

export async function payIdRegister(env: Env, payload: {
  payId: string;
  payIdName: string;
  bankAccountNumber: string;
  bsb?: string;
}) {
  return await call(env, PATHS.PAYID_REGISTER, { method: "POST", body: JSON.stringify(payload) });
}

export async function payIdUpdateStatus(env: Env, payload: {
  payId: string;
  bankAccountNumber: string;
  bsb?: string;
  status: "Active" | "Disabled";
}) {
  return await call(env, PATHS.PAYID_UPDATE_STATUS, { method: "POST", body: JSON.stringify(payload) });
}

export async function payIdUpdateName(env: Env, payload: {
  payId: string;
  payIdName: string;
  bankAccountNumber: string;
  bsb?: string;
}) {
  return await call(env, PATHS.PAYID_UPDATE_NAME, { method: "POST", body: JSON.stringify(payload) });
}