// lib/url-allowlist.ts
//
// Utilities to parse allowlist env vars and check callback URLs safely.
// We accept comma-separated *origins* (hosts), with or without scheme/path.
// Examples that all normalize to the same host:
//   "https://abcd.ngrok-free.app", "abcd.ngrok-free.app", "https://abcd.ngrok-free.app/foo"

function normalizeHost(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;

  // Try URL parsing first (handles https://host[:port]/path)
  try {
    const u = new URL(s);
    return u.hostname.toLowerCase();
  } catch {
    // Fallback: strip scheme if the user pasted it, then take up to first slash/colon
    const noScheme = s.replace(/^[a-z]+:\/\//i, "");
    const hostOnly = noScheme.split(/[/:?#]/)[0];
    return hostOnly ? hostOnly.toLowerCase() : null;
  }
}

/** Parse env var like "abcd.ngrok-free.app, localhost, https://foo.example.com/x" → ["abcd.ngrok-free.app","localhost","foo.example.com"] */
export function parseAllowedOrigins(src?: string | null): string[] {
  if (!src) return [];
  const out = new Set<string>();
  for (const piece of String(src).split(",")) {
    const h = normalizeHost(piece);
    if (h) out.add(h);
  }
  return Array.from(out);
}

/** Return true if the callback URL’s hostname is in (or endsWith) one of the allowed hosts */
export function isCallbackAllowed(callbackUrl: string, allowedHosts: string[]): boolean {
  if (!allowedHosts?.length) return true; // nothing configured -> allow
  let host: string;
  try {
    host = new URL(callbackUrl).hostname.toLowerCase();
  } catch {
    return false; // invalid URL
  }
  return allowedHosts.some((allowed) => {
    allowed = allowed.toLowerCase();
    // exact match or subdomain match (e.g., foo.bar.com endsWith bar.com)
    return host === allowed || host.endsWith(`.${allowed}`);
  });
}
