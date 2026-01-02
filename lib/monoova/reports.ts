// lib/monoova/reports.ts
import type { Env } from "./maccount";

const reqd = (k: string, v?: string) => { if (!v) throw new Error(`Missing env: ${k}`); return v; };

function base(env: Env) {
  return env === "sandbox"
    ? reqd("MONOOVA_BASE_SANDBOX", process.env.MONOOVA_BASE_SANDBOX)
    : reqd("MONOOVA_BASE_LIVE", process.env.MONOOVA_BASE_LIVE);
}

function basic(env: Env) {
  const user = env === "sandbox" ? reqd("SANDBOX_MACCOUNT", process.env.SANDBOX_MACCOUNT)
                                 : reqd("LIVE_MACCOUNT", process.env.LIVE_MACCOUNT);
  const pass = env === "sandbox" ? reqd("MONOOVA_API_KEY_SANDBOX", process.env.MONOOVA_API_KEY_SANDBOX)
                                 : reqd("MONOOVA_API_KEY_LIVE", process.env.MONOOVA_API_KEY_LIVE);
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

async function call(env: Env, path: string) {
  const url = `${base(env)}${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json", Authorization: basic(env) } } as any);
  const txt = await res.text();
  const body = (() => { try { return txt ? JSON.parse(txt) : undefined; } catch { return txt; } })();
  if (!res.ok) throw new Error(`Upstream ${res.status} ${res.statusText}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  return body;
}

const P = {
  NPP: (s: string, e: string) => (process.env.MONOOVA_PATH_REPORT_RECEIVABLES_NPP ?? "/receivables/v1/npp/{startDate}/{endDate}")
    .replace("{startDate}", encodeURIComponent(s)).replace("{endDate}", encodeURIComponent(e)),
  PAYTO: (s: string, e: string) => (process.env.MONOOVA_PATH_REPORT_RECEIVABLES_PAYTO ?? "/receivables/v1/payto/{startDate}/{endDate}")
    .replace("{startDate}", encodeURIComponent(s)).replace("{endDate}", encodeURIComponent(e)),
  RTGS_IMT: (s: string, e: string) => (process.env.MONOOVA_PATH_REPORT_RECEIVABLES_RTGS_IMT ?? "/receivables/v1/rtgs-imt/{startDate}/{endDate}")
    .replace("{startDate}", encodeURIComponent(s)).replace("{endDate}", encodeURIComponent(e)),
};

export async function receivablesNpp(env: Env, startYMD: string, endYMD: string) { return call(env, P.NPP(startYMD, endYMD)); }
export async function receivablesPayto(env: Env, startYMD: string, endYMD: string) { return call(env, P.PAYTO(startYMD, endYMD)); }
export async function receivablesRtgsImt(env: Env, startYMD: string, endYMD: string) { return call(env, P.RTGS_IMT(startYMD, endYMD)); }