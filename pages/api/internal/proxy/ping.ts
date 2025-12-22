// file: pages/api/internal/proxy/ping.ts
// Simple health-check: verifies which env the chain sees.

import type { NextApiRequest, NextApiResponse } from "next";

export function getBaseUrlForEnv(req: NextApiRequest): string {
  const env = req.cookies.env === "LIVE" ? "LIVE" : "SANDBOX";
  return env === "LIVE" ? "https://api.mpay.com.au" : "https://api.m-pay.com.au";
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Normalize cookie to 'SANDBOX' | 'LIVE'
  const raw = (req.cookies["env"] ?? "SANDBOX").toString();
  const env =
    raw.toUpperCase() === "LIVE" ? "LIVE" :
    raw.toUpperCase() === "SANDBOX" ? "SANDBOX" :
    "SANDBOX";

  res.status(200).json({ ok: true, env });
}
