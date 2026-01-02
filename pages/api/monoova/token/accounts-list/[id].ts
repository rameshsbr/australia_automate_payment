// pages/api/monoova/token/accounts-list/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { monoovaListTokens } from "@/lib/monoova/token";

const Env = z.enum(["sandbox", "live"]).default("sandbox");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("[API] GET /api/monoova/token/accounts-list/:id", { url: req.url, query: req.query });

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  try {
    const env = Env.parse(req.query.env ?? "sandbox");
    const mAccount = String(req.query.id || "").trim();
    if (!mAccount) return res.status(400).json({ error: "mAccount required" });

    const rows = await monoovaListTokens(env, mAccount);
    return res.status(200).json({ rows });
  } catch (e: any) {
    const msg = e?.message || String(e);
    const is401 = /Unauthorized|MerchantFailedToLogin/i.test(msg);
    const isLocked = /MerchantLockedOut/i.test(msg);
    const code = is401 || isLocked ? 401 : 500;
    res.status(code).json({ error: msg });
  }
}