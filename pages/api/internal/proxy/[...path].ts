import type { NextApiRequest, NextApiResponse } from "next";
import { authHeaderForPath, monoovaConfig } from "@/lib/monoova";

// simple alias to keep older URLs working
const pathAlias = (p: string) => {
  const clean = p.replace(/^\/+/, "");
  if (clean === "tools/ping") return "public/v1/ping";
  return clean;
};

type Mode = "SANDBOX" | "LIVE";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mode = (req.cookies["env"]?.toUpperCase() as Mode) || "SANDBOX";
  const cfg = monoovaConfig(mode);

  const rawPath = ((req.query.path as string[]) || []).join("/");
  const proxiedPath = pathAlias(rawPath);

  const query = req.url?.includes("?") ? `?${req.url.split("?")[1]}` : "";
  const target = `${cfg.base}/${proxiedPath}${query}`;

  const method = (req.method || "GET").toUpperCase();
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body ?? {});

  try {
    // IMPORTANT: auth header may require an async token – always await
    const auth = await authHeaderForPath(proxiedPath, mode);

    // strip hop-by-hop & sensitive headers
    const {
      host,
      connection,
      cookie,               // we decide env ourselves
      authorization: _auth, // never forward client Authorization
      "content-length": _cl,
      ...forward
    } = (req.headers as any) || {};

    const upstream = await fetch(target, {
      method,
      headers: {
        ...forward,
        ...(auth ? { authorization: auth } : {}),
        accept: forward.accept || "application/json",
        "content-type": forward["content-type"] || "application/json",
      },
      body,
    });

    res.status(upstream.status);
    upstream.headers.forEach((v, k) => res.setHeader(k, v));
    res.send(await upstream.text());
  } catch (err: any) {
    const c = err?.cause || {};
    console.error("Proxy error", {
      mode,
      target,
      message: err?.message,
      code: c.code,
      errno: c.errno,
      syscall: c.syscall,
      host: c.hostname,
    });
    res.status(502).json({
      ok: false,
      mode,
      target,
      error: err?.message || String(err),
      code: c.code,
      errno: c.errno,
      syscall: c.syscall,
      host: c.hostname,
    });
  }
}