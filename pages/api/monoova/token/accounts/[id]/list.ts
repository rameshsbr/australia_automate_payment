import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { monoovaListTokens } from "@/lib/monoova/token";
const Env = z.enum(["sandbox", "live"]).default("sandbox");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") { res.setHeader("Allow","GET"); return res.status(405).end(); }
  try {
    const env = Env.parse(req.query.env ?? "sandbox");
    const mAccount = String(req.query.id || "").trim();
    if (!mAccount) return res.status(400).json({ error: "mAccount required" });
    const rows = await monoovaListTokens(env, mAccount);
    res.status(200).json({ rows });
  } catch (e: any) {
    const msg = e?.message || String(e);
    res.status(/Unauthorized|MerchantFailedToLogin/i.test(msg) ? 401 : 500).json({ error: msg });
  }
}