// file: lib/monoova.ts
// Monoova Payments Platform auth helpers (Basic only)

export type Mode = "SANDBOX" | "LIVE";

type MonoovaCfg = {
  base: string;
  apiKey?: string;    // API key (preferred)
  mAccount?: string;  // optional fallback if you really must
};

function req(name: string, val?: string) {
  if (!val || !val.trim()) throw new Error(`Missing env: ${name}`);
  return val.trim();
}

export function monoovaConfig(mode: Mode): MonoovaCfg {
  if (mode === "LIVE") {
    return {
      base: req("LIVE_API_BASE", process.env.LIVE_API_BASE),       // e.g. https://api.mpay.com.au
      apiKey: (process.env.LIVE_API_KEY || "").trim(),
      mAccount: (process.env.LIVE_MACCOUNT || "").trim(),
    };
  }
  // SANDBOX (default)
  return {
    base: req("SANDBOX_API_BASE", process.env.SANDBOX_API_BASE),   // e.g. https://api.m-pay.com.au
    apiKey: (process.env.SANDBOX_API_KEY || "").trim(),
    mAccount: (process.env.SANDBOX_MACCOUNT || "").trim(),
  };
}

function basic(username: string) {
  return "Basic " + Buffer.from(`${username}:`).toString("base64");
}

/**
 * Return the Authorization header for a Monoova path.
 * - No auth for `public/*`
 * - Basic auth otherwise (username = API key; blank password)
 */
export async function authHeaderForPath(
  path: string,
  mode: Mode
): Promise<string | undefined> {
  const clean = (path || "").replace(/^\/+/, "");
  if (clean.startsWith("public/")) return undefined;

  const cfg = monoovaConfig(mode);
  const user = (cfg.apiKey && cfg.apiKey.trim()) || (cfg.mAccount && cfg.mAccount.trim()) || "";
  if (!user) throw new Error("No API key configured for Monoova");
  return basic(user);
}