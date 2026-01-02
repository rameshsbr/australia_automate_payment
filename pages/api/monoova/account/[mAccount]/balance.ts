// pages/api/monoova/account/[mAccount]/balance.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { monoovaGetBalance } from "@/lib/monoova/maccount";

const Env = z.enum(["sandbox", "live"]).default("sandbox");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const env = Env.parse(req.query.env ?? "sandbox");
    const mAccount = String(req.query.mAccount || "").trim();
    if (!mAccount) return res.status(400).json({ error: "mAccount required" });

    const bal = await monoovaGetBalance(env, mAccount);
    res.status(200).json(bal);
  } catch (e: any) {
    res.status(/Unauthorized|MerchantFailedToLogin/i.test(String(e)) ? 401 : 500)
       .json({ error: e?.message || String(e) });
  }
}