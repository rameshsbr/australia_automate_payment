import type { NextApiRequest, NextApiResponse } from "next";
import { getBaseUrlForEnv } from "../../internal/proxy/ping";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { uid } = req.query;
  if (!uid || typeof uid !== "string")
    return res.status(400).json({ error: "Missing ?uid=<uniqueReference>" });

  const base = getBaseUrlForEnv(req);
  const url = `${base}/financial/v2/status/${encodeURIComponent(uid)}`;

  const f = await fetch(url, {
    headers: { "content-type": "application/json" },
    cache: "no-store",
  });
  const json = await f.json().catch(() => ({}));
  res.status(f.status).json(json);
}
