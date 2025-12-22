import type { NextApiRequest, NextApiResponse } from "next";
import { getBaseUrlForEnv } from "../../internal/proxy/ping";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { date, from, to, pageNumber, pageSize } = req.query;

  const base = getBaseUrlForEnv(req);
  const qs = new URLSearchParams();
  if (typeof date === "string") qs.set("date", date);
  if (typeof from === "string") qs.set("from", from);
  if (typeof to === "string") qs.set("to", to);
  if (typeof pageNumber === "string") qs.set("pageNumber", pageNumber);
  if (typeof pageSize === "string") qs.set("pageSize", pageSize);

  const url = `${base}/financial/v2/status?${qs.toString()}`;
  const f = await fetch(url, { headers: { "content-type": "application/json" }, cache: "no-store" });
  const json = await f.json().catch(() => ({}));
  res.status(f.status).json(json);
}
