// pages/api/internal/proxy/[...path].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authHeaderForPath, monoovaConfig } from "@/lib/monoova";

// Pass raw bodies through unchanged
export const config = { api: { bodyParser: false } };

type Mode = "MOCK" | "SANDBOX" | "LIVE";

function resolveMode(req: NextApiRequest): Mode {
  const cookieEnv = req.cookies["env"]?.toUpperCase();
  if (cookieEnv === "MOCK") return "MOCK";
  if (cookieEnv === "LIVE") return "LIVE";
  return "SANDBOX";
}

function readRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve) => {
    if (req.method === "GET" || req.method === "HEAD") return resolve("");
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const mode = resolveMode(req);
    const debug = req.headers["x-debug-auth"] === "1" || req.query.debug === "1";

    const pathParts = Array.isArray(req.query.path)
      ? (req.query.path as string[])
      : req.query.path
      ? [String(req.query.path)]
      : [];
    const path = pathParts.join("/");

    const query = req.url && req.url.includes("?") ? `?${req.url.split("?")[1]}` : "";

    let base: string;
    let auth: string | undefined;
    let authScheme = "none";

    if (mode === "MOCK") {
      base = process.env.MONOOVA_BASE_MOCK || "http://localhost:4010";
      auth = undefined;
      authScheme = "mock";
    } else {
      const cfg = monoovaConfig(mode);
      base = cfg.base;
      auth = await authHeaderForPath(path, mode); // <- always Basic API_KEY:
      authScheme = auth?.split(" ")[0]?.toLowerCase() || "none";
    }

    const url = `${base}/${path}${query}`;
    const method = (req.method || "GET").toUpperCase();
    const rawBody = await readRawBody(req);

    // Strip hop-by-hop + client auth/cookie
    const {
      host,
      connection,
      "content-length": _cl,
      authorization: _clientAuth,
      cookie: _cookie,
      ...forward
    } = (req.headers as any) || {};

    const headers: Record<string, string> = {
      accept: (forward.accept as string) || "application/json",
      "content-type": (forward["content-type"] as string) || "application/json",
      ...(auth ? { authorization: auth } : {}),
      ...Object.fromEntries(
        Object.entries(forward).filter(([k]) =>
          !["accept", "content-type", "authorization", "host", "connection", "content-length", "cookie"]
            .includes(k.toLowerCase())
        )
      ),
    };

    const upstream = await fetch(url, {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : rawBody || undefined,
    });

    const text = await upstream.text();

    // Propagate status + safe headers
    res.status(upstream.status);
    upstream.headers.forEach((v, k) => {
      if (!["transfer-encoding", "content-encoding"].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });

    // Debug headers from proxy (only when requested)
    if (debug) {
      res.setHeader("x-proxy-mode", mode);
      res.setHeader("x-proxy-target", url);
      res.setHeader("x-proxy-auth-scheme", authScheme);
    }

    try {
      res.send(JSON.parse(text));
    } catch {
      res.send(text);
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "proxy_error" });
  }
}