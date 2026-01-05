import type { NextApiRequest, NextApiResponse } from "next";
import { payIdEnquiry } from "@/lib/monoova/payid";

type Mode = "sandbox" | "live";
function resolveMode(req: NextApiRequest): Mode {
  const q = String(req.query.env || "").toLowerCase();
  if (q === "live") return "live";
  if (q === "sandbox") return "sandbox";
  const c = String(req.cookies?.env || "").toLowerCase();
  return c === "live" ? "live" : "sandbox";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end(); }
  try {
    const env = resolveMode(req);
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    // Accept legacy fields from the UI, but convert:
    const payId = body.payId ?? body.alias;
    if (!payId) return res.status(400).json({ error: "payId is required" });

    const out = await payIdEnquiry(env, payId);
    res.status(200).json(out);
  } catch (e: any) {
    res.status(502).json({ error: e?.message || String(e) });
  }
}