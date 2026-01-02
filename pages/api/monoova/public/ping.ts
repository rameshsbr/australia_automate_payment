// pages/api/monoova/public/ping.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMonoova } from "@/lib/monoova/client";
import type { Mode } from "@/lib/monoova";
import { logTransaction } from "@/lib/monoova/logs";
import { P_PUBLIC_PING } from "@/lib/monoova/paths";

function normalizeMode(v?: string | string[]): Mode {
  const raw = Array.isArray(v) ? v[0] : v;
  const up = (raw ?? "").toString().trim().toUpperCase();
  if (up === "LIVE") return "LIVE";
  if (up === "MOCK") return "MOCK";
  return "SANDBOX";
}

function resolveMode(req: NextApiRequest): Mode {
  // Only use the query param if it actually exists; otherwise fall back to cookie.
  const hasQueryEnv = typeof req.query.env !== "undefined";
  if (hasQueryEnv) return normalizeMode(req.query.env as any);
  return normalizeMode(req.cookies["env"]);
}

// only forward safe headers back to the client
const SAFE_HEADERS = new Set([
  "content-type",
  "cache-control",
  "etag",
  "last-modified",
  "x-request-id",
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const mode = resolveMode(req);
  let status = 500;
  let data: any = null;

  try {
    const { status: s, headers, data: d } = await fetchMonoova(P_PUBLIC_PING, { method: "GET" }, mode);
    status = s ?? 200;
    data = d ?? null;

    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        const key = k.toLowerCase();
        if (SAFE_HEADERS.has(key) && v != null) res.setHeader(k, v as any);
      }
    }

    return res.status(status).json(data ?? { status: "OK" });
  } catch (e: any) {
    const msg = e?.message || String(e);
    const is401 = /Unauthorized|MerchantFailedToLogin/i.test(msg);
    const isLocked = /MerchantLockedOut/i.test(msg);
    status = is401 || isLocked ? 401 : 500;
    data = { error: msg };
    return res.status(status).json(data);
  } finally {
    try {
      await logTransaction({
        kind: "public-ping",
        mode,
        path: P_PUBLIC_PING,
        httpStatus: status,
        responseBody: data,
      });
    } catch {
      // ignore logging errors
    }
  }
}