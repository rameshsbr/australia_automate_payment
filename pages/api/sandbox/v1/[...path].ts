// SANDBOX clone API: /api/sandbox/v1/*
import type { NextApiRequest, NextApiResponse } from "next";
import { prismaSandbox as prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = (req.headers["x-api-key"] as string) ?? "";
  if (!key) return res.status(401).json({ error: "Unauthorized" });

  const apiKey = await prisma.apiKey.findFirst({ where: { key, active: true } }).catch(() => null);
  if (!apiKey) return res.status(401).json({ error: "Unauthorized" });

  const host = req.headers.host ?? "localhost:3000";
  const pathSegs = (req.query.path as string[]) || [];
  const path = pathSegs.join("/");
  const query = req.url && req.url.includes("?") ? `?${req.url.split("?")[1]}` : "";
  const upstreamUrl = `http://${host}/api/internal/proxy/${path}${query}`;

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
      // IMPORTANT: your internal proxy reads uppercase "SANDBOX" / "LIVE"
      cookie: "env=SANDBOX;",
    },
    body,
  });

  res.status(upstream.status);
  upstream.headers.forEach((v, k) => res.setHeader(k, v));
  res.send(await upstream.text());
}
