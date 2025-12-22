import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mode = (req.cookies?.env || "SANDBOX").toUpperCase();

  if (req.method === "POST") {
    return res.status(200).json({
      ok: true,
      mode,
      method: req.method,
      headers: {
        "content-type": req.headers["content-type"] || null,
        cookie: req.headers.cookie || null,
      },
      body: req.body ?? null,
      keysAtDisbursement0: Array.isArray((req.body as any)?.disbursements)
        ? Object.keys((req.body as any).disbursements[0] || {})
        : null,
    });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      mode,
      method: req.method,
      query: req.query,
    });
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end("Method Not Allowed");
}
