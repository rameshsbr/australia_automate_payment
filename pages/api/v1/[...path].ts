import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

// WHY: This is the CLONE API your clients call. We check your x-api-key, then forward to internal proxy.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = (req.headers["x-api-key"] as string) ?? "";
  const apiKey = await prisma.apiKey.findFirst({ where: { key, active: true } });
  if (!apiKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Preserve original path and query; forward to internal proxy (which injects provider credentials)
  const path = (req.query.path as string[]).join("/");
  const search = req.url?.includes("?") ? `?${req.url.split("?")[1]}` : "";
  const upstreamUrl = `${process.env.NEXT_PUBLIC_BASE ?? ""}/api/internal/proxy/${path}${search}`;

  const upstream = await fetch(upstreamUrl, {
    method: req.method,
    headers: {
      // Hide client key from provider
      "content-type": req.headers["content-type"] || "application/json",
      cookie: `env=${apiKey.environment};`
    },
    body: ["GET", "HEAD"].includes(req.method || "") ? undefined : JSON.stringify(req.body)
  });

  res.status(upstream.status);
  upstream.headers.forEach((v, k) => res.setHeader(k, v));
  const body = await upstream.text();
  res.send(body);
}
