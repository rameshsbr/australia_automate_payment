import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const envCookie = req.headers.cookie?.match(/(?:^|;\s*)env=([^;]+)/)?.[1];
  const resolvedEnv = (envCookie || process.env.ENVIRONMENT || "SANDBOX").toUpperCase();

  const key = resolvedEnv === "LIVE"
    ? process.env.MONOOVA_API_KEY_LIVE
    : resolvedEnv === "SANDBOX"
      ? process.env.MONOOVA_API_KEY_SANDBOX
      : "";

  const basic = key ? `Basic ${Buffer.from(`${key}:`).toString("base64")}` : null;

  res.json({
    envCookie: envCookie || null,
    resolvedEnv,
    bases: {
      MOCK: !!process.env.MONOOVA_BASE_MOCK,
      SANDBOX: !!process.env.MONOOVA_BASE_SANDBOX,
      LIVE: !!process.env.MONOOVA_BASE_LIVE,
    },
    hasKeys: {
      SANDBOX: !!process.env.MONOOVA_API_KEY_SANDBOX,
      LIVE: !!process.env.MONOOVA_API_KEY_LIVE,
    },
    // show only prefix of the header to confirm it’s set (no secrets leaked)
    authPreview: basic ? basic.slice(0, 16) + "…" : null,
  });
}