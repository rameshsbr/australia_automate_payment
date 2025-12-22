import type { NextApiRequest, NextApiResponse } from "next";
import { toMonoovaRequest } from "@/lib/payments/normalize";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const payload = toMonoovaRequest(req.body);
  const scheme = req.headers.host?.startsWith("localhost") ? "http" : "https";

  const upstream = await fetch(
    `${scheme}://${req.headers.host}/api/internal/proxy/financial/v2/transaction/validate`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: req.headers.cookie || "",
      },
      body: JSON.stringify(payload),
    },
  );

  res.status(upstream.status);
  upstream.headers.forEach((v, k) => res.setHeader(k, v));
  res.send(await upstream.text());
}
