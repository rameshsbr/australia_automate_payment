import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const upstream = await fetch(`http://localhost:3000/api/internal/proxy/financial/v2/transaction/validate`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: req.headers.cookie || "" },
    body: JSON.stringify(req.body),
  });

  res.status(upstream.status);
  upstream.headers.forEach((v, k) => res.setHeader(k, v));
  res.send(await upstream.text());
}
