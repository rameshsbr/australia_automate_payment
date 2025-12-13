import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { Environment } from "@prisma/client";

// WHY: This endpoint ensures the provider only sees OUR keys, never client keys.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const envCookie = (req.cookies["env"] ?? "SANDBOX") as "SANDBOX" | "LIVE";
  const cfg = env.provider[envCookie];

  const path = (req.query.path as string[]).join("/");
  const url = `${cfg.base}/${path}${req.url?.includes("?") ? "?" + req.url?.split("?")[1] : ""}`;

  const method = req.method ?? "GET";
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Remove hop-by-hop headers
  const { host, connection, "content-length": _cl, ...forwardHeaders } = req.headers as Record<string, string>;

  const upstream = await fetch(url, {
    method,
    headers: {
      ...forwardHeaders,
      authorization: `Bearer ${cfg.key}`
    },
    body: ["GET", "HEAD"].includes(method) ? undefined : (req as any)
  });

  const data = await upstream.text();
  res.status(upstream.status);
  for (const [k, v] of upstream.headers) res.setHeader(k, v);
  res.send(data);

  // Fire-and-forget log (best-effort)
  prisma.apiLog.create({
    data: {
      organizationId: (await prisma.organization.findFirst())!.id,
      environment: envCookie as Environment,
      path: `/${path}`,
      method,
      status: upstream.status,
      reqBody: ["GET", "HEAD"].includes(method) ? undefined : (req.body ?? null),
      resBody: (() => { try { return JSON.parse(data); } catch { return null; } })()
    }
  }).catch(() => {});
}
