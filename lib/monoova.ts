// Helper utilities for Monoova authentication and routing
export type Mode = "SANDBOX" | "LIVE";

export type MonoovaCfg = {
  base: string;
  apiKey: string;
  mAccount: string;
};

export const monoovaConfig = (mode: Mode): MonoovaCfg => ({
  base: mode === "LIVE" ? process.env.LIVE_API_BASE! : process.env.SANDBOX_API_BASE!,
  apiKey: mode === "LIVE" ? process.env.LIVE_API_KEY! : process.env.SANDBOX_API_KEY!,
  mAccount: mode === "LIVE" ? process.env.LIVE_MACCOUNT! : process.env.SANDBOX_MACCOUNT!,
});

export const basicForApiKey = (apiKey: string) =>
  "Basic " + Buffer.from(`${apiKey}:`).toString("base64");

export const basicForTokenEndpoint = (mAccount: string, apiKey: string) =>
  "Basic " + Buffer.from(`${mAccount}:${apiKey}`).toString("base64");

// naive in-memory token cache
const tokenCache: Record<Mode, { token: string; exp: number } | undefined> = {
  SANDBOX: undefined,
  LIVE: undefined,
};

const TOKEN_PATH = process.env.MONOOVA_TOKEN_PATH || "authorisation/token";

export async function getBearerToken(mode: Mode): Promise<string> {
  const now = Date.now();
  const cached = tokenCache[mode];
  if (cached && cached.exp > now + 15_000) return cached.token;

  const cfg = monoovaConfig(mode);
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
  const token = data.access_token || data.token || "";
  const ttlMs = (data.expires_in ? Number(data.expires_in) : 1800) * 1000;
  tokenCache[mode] = { token, exp: now + Math.max(60_000, ttlMs - 60_000) };
  return token;
}

// choose proper Authorization header per path
export async function authHeaderForPath(path: string, mode: Mode): Promise<string> {
  const cfg = monoovaConfig(mode);
  if (path.startsWith("payto") || path.startsWith("cards")) {
    const token = await getBearerToken(mode);
    return `Bearer ${token}`;
  }
  if (path.startsWith("authorisation") || path.startsWith("authorization")) {
    return basicForTokenEndpoint(cfg.mAccount, cfg.apiKey);
  }
  return basicForApiKey(cfg.apiKey);
}
