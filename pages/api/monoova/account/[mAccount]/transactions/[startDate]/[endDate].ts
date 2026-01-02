// pages/api/monoova/account/[mAccount]/transactions/[startDate]/[endDate].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { monoovaGetTransactions } from "@/lib/monoova/maccount";

const Env = z.enum(["sandbox", "live"]).default("sandbox");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const env = Env.parse(req.query.env ?? "sandbox");
    const mAccount = String(req.query.mAccount || "").trim();
    const startDate = String(req.query.startDate || "").trim(); // YYYY-MM-DD
    const endDate = String(req.query.endDate || "").trim();     // YYYY-MM-DD
    if (!mAccount) return res.status(400).json({ error: "mAccount required" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return res.status(400).json({ error: "startDate/endDate must be YYYY-MM-DD" });
    }

    const rows = await monoovaGetTransactions(env, mAccount, startDate, endDate, {
      direction: (req.query.direction as string) || undefined, // 'credit' | 'debit' | undefined
      cursor: (req.query.cursor as string) || undefined,
      pageSize: req.query.pageSize ? Math.min(200, Math.max(1, Number(req.query.pageSize))) : 100,
    });

    res.status(200).json(rows);
  } catch (e: any) {
    res.status(/Unauthorized|MerchantFailedToLogin/i.test(String(e)) ? 401 : 500)
       .json({ error: e?.message || String(e) });
  }
}