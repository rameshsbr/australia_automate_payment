import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const payload = req.body;
  const method = payload?.disbursements?.[0]?.disbursementMethod;
  const normalizedMethod = typeof method === "string" ? method.toLowerCase() : "";

  if (
    ["directdebit", "directdebit_token", "directdebittoken", "paychildmaccount", "debitchildmaccount"].includes(
      normalizedMethod,
    )
  ) {
    return res
      .status(400)
      .json({
        error:
          "This method is not enabled in this tenant. Use supported rails: directcredit, token, nppcreditbankaccount, nppcreditpayid, bpay.",
      });
  }

  if (normalizedMethod === "bpay" && payload?.source?.type !== "mWallet") {
    return res
      .status(400)
      .json({ error: "BPAY requires source.type=mWallet (mWalletId + pin)." });
  }

  const scheme = req.headers.host?.startsWith("localhost") ? "http" : "https";

  const upstream = await fetch(
    `${scheme}://${req.headers.host}/api/internal/proxy/financial/v2/transaction/execute`,
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
