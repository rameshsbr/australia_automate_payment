// file: pages/sandbox/api/v1/[...path].ts
// SANDBOX clone API

import type { NextApiRequest, NextApiResponse } from "next";
import { prismaSandbox as prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = (req.headers["x-api-key"] as string) ?? "";
  if (!key) return res.status(401).json({ error: "Unauthorized" });

  const apiKey = await prisma.apiKey.findFirst({ where: { key, active: true } }).catch(() => null);
  if (!apiKey) return res.status(401).json({ error: "Unauthorized" });

  const host = req.headers.host ?? "localhost:3000";
  const segs = (req.query.path as string[]) || [];
  const path = segs.join("/");
  const q = req.url && req.url.includes("?") ? `?${req.url.split("?")[1]}` : "";
  const upstreamUrl = `http://${host}/api/internal/proxy/${path}${q}`;

  const method = (req.method || "GET").toUpperCase();
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body ?? {});

  const upstream = await fetch(upstreamUrl, {
    method,
    headers: {
      "content-type": (req.headers["content-type"] as string) || "application/json",
      // IMPORTANT: internal proxy expects uppercase
      cookie: "env=SANDBOX;",
    },
    body,
  });

  res.status(upstream.status);
  upstream.headers.forEach((v, k) => res.setHeader(k, v));
  res.send(await upstream.text());
}