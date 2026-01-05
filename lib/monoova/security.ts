// lib/monoova/security.ts
import type { Env } from "./maccount";
import crypto from "crypto";

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

const PUBLIC_KEY_PATH = process.env.MONOOVA_PATH_PUBLIC_KEY ?? "/public/v1/certificate/public-key";
const ENC_ON = (process.env.MONOOVA_SECURITY_ENCRYPT ?? "on").toLowerCase() !== "off";
const RSA_MODE = (process.env.MONOOVA_RSA_ALGO ?? "pkcs1").toLowerCase(); // "pkcs1" | "oaep"
const OAEP_HASH = (process.env.MONOOVA_RSA_OAEP_HASH ?? "sha256").toLowerCase();

const pubkeyCache: Partial<Record<Env, string>> = {};

async function fetchMonoovaPublicKeyPEM(env: Env): Promise<string> {
  if (pubkeyCache[env]) return pubkeyCache[env] as string;

  const url = `${base(env)}${PUBLIC_KEY_PATH}`;
  const r = await fetch(url, {
    headers: { Accept: "application/x-pem-file, application/octet-stream, text/plain, */*;q=0.2" },
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`Failed to fetch Monoova public key (${r.status}): ${t || r.statusText}`);
  }

  // Prefer ArrayBuffer for robustness (handles PEM or DER)
  const buf = Buffer.from(await r.arrayBuffer());
  let pem: string;

  const asText = buf.toString("utf8");
  if (asText.includes("-----BEGIN")) {
    pem = asText.trim();
  } else {
    // Assume DER -> convert to PEM (SPKI)
    const keyObj = crypto.createPublicKey({ key: buf, format: "der", type: "spki" });
    pem = keyObj.export({ format: "pem", type: "spki" }).toString();
  }

  pubkeyCache[env] = pem;
  return pem;
}

export async function encryptForMonoova(env: Env, plaintext: string): Promise<string> {
  const pem = await fetchMonoovaPublicKeyPEM(env);
  const padding =
    RSA_MODE === "oaep" ? crypto.constants.RSA_PKCS1_OAEP_PADDING : crypto.constants.RSA_PKCS1_PADDING;

  const enc = crypto.publicEncrypt(
    {
      key: pem,
      padding,
      ...(padding === crypto.constants.RSA_PKCS1_OAEP_PADDING ? { oaepHash: OAEP_HASH } : {}),
    },
    Buffer.from(plaintext, "utf8"),
  );
  return enc.toString("base64");
}

export async function monoovaCreateSecurityToken(env: Env) {
  // GET – returns a short-lived token for privileged endpoints
  return await call(env, PATHS.CREATE_TOKEN, { method: "GET" });
}

export async function monoovaChangePassword(env: Env, payload: { oldPassword: string; newPassword: string }) {
  const body = ENC_ON
    ? {
        oldPassword: await encryptForMonoova(env, payload.oldPassword),
        newPassword: await encryptForMonoova(env, payload.newPassword),
      }
    : payload;

  return await call(env, PATHS.CHANGE_PW, { method: "POST", body: JSON.stringify(body) });
}

export async function monoovaGetSignInAccountSettings(env: Env) {
  return await call(env, PATHS.SIGNIN_SETTINGS, { method: "GET" });
}