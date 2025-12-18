import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Wrapper for Monoova validate:
 * - Accepts your “legacy” body shape (details.bsb/accountNumber/etc.)
 * - Normalizes to Monoova shape (toDirectCreditDetails + disbursementMethod)
 * - Proxies to /api/internal/proxy/financial/v2/transaction/validate
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("content-type", "application/json");
    return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
  }

  // Build same-host absolute URL so this works in dev & prod
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  const host = (req.headers.host as string) || "localhost:3000";
  const upstreamUrl = `${proto}://${host}/api/internal/proxy/financial/v2/transaction/validate`;

  // ---- Normalise "legacy" input into Monoova’s expected shape ----
  const input = req.body ?? {};
  const out: any = {
    callerUniqueReference: input.callerUniqueReference,
    source: input.source,
    disbursements: (input.disbursements ?? []).map((d: any) => {
      const method = d.disbursementMethod || (d.type === "DE" ? "DirectCredit" : undefined);
      const details = d.toDirectCreditDetails || d.details || {};
      const bsb = details.bsb || details.BSB || details.toBSB || details.bsbNumber;
      return {
        type: d.type,
        disbursementMethod: method,
        amount: d.amount,
        currency: d.currency || "AUD",
        toDirectCreditDetails:
          method === "DirectCredit"
            ? {
                bsbNumber: details.bsbNumber || bsb,
                bsb,
                accountNumber: details.accountNumber || details.toAccountNumber,
                accountName: details.accountName || details.remitterName,
                lodgementReference: details.lodgementReference || details.reference,
              }
            : undefined,
      };
    }),
  };

  // Strip out undefined keys to keep payload clean
  out.disbursements = out.disbursements.map((d: any) =>
    Object.fromEntries(Object.entries(d).filter(([_, v]) => v !== undefined))
  );

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // important: pass through your env cookie so the proxy knows SANDBOX vs LIVE
        cookie: req.headers.cookie || "",
      },
      body: JSON.stringify(out),
    });

    const text = await upstream.text();
    res.status(upstream.status);
    upstream.headers.forEach((v, k) => res.setHeader(k, v));
    res.send(text);
  } catch (e: any) {
    res
      .status(502)
      .json({ ok: false, error: e?.message || "Upstream error", cause: e?.cause ?? null });
  }
}