import type { NextApiRequest, NextApiResponse } from "next";
import { authHeaderForPath, monoovaConfig } from "@/lib/monoova";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mode = (req.cookies["env"]?.toUpperCase() as "SANDBOX" | "LIVE") || "SANDBOX";
  const cfg = monoovaConfig(mode);

  const path = (req.query.path as string[]).join("/");
  const query = req.url?.includes("?") ? `?${req.url.split("?")[1]}` : "";
  const url = `${cfg.base}/${path}${query}`;

  const method = (req.method || "GET").toUpperCase();
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body ?? {});

  const auth = await authHeaderForPath(path, mode);

  // strip hop-by-hop headers
  const { host, connection, "content-length": _cl, ...forward } = (req.headers as any) || {};

  const upstream = await fetch(url, {
    method,
    headers: {
      ...forward,
      authorization: auth,
      accept: forward.accept || "application/json",
      "content-type": forward["content-type"] || "application/json",
    },
    body,
  });

  res.status(upstream.status);
  upstream.headers.forEach((v, k) => res.setHeader(k, v));
  res.send(await upstream.text());
}
