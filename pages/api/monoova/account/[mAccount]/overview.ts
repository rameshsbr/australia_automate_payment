// pages/api/monoova/account/[mAccount]/overview.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  monoovaGetAccount,
  monoovaGetBalance,
  monoovaGetTransactions,
} from "@/lib/monoova/maccount";

const Env = z.enum(["sandbox", "live"]).default("sandbox");

function defaultRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6); // last 7 days
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  return { from: fmt(start), to: fmt(end) };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  try {
    const env = Env.parse((req.query.env as string) ?? "sandbox");
    const mAccount = String(req.query.mAccount || "").trim();
    if (!mAccount) return res.status(400).json({ error: "mAccount required" });

    const from = (req.query.from as string) || defaultRange().from;
    const to = (req.query.to as string) || defaultRange().to;

    const [acct, bal, txs] = await Promise.all([
      monoovaGetAccount(env, mAccount),
      monoovaGetBalance(env, mAccount),
      monoovaGetTransactions(env, mAccount, from, to, { pageSize: 100 }),
    ]);

    return res.status(200).json({
      mAccount,
      period: { from, to },
      account: acct?.raw ?? acct,
      balance: bal,
      transactions: txs?.rows ?? [],
      raw: { txs: txs?.raw ?? null },
    });
  } catch (e: any) {
    const msg = e?.message || String(e);
    const code = /Unauthorized|MerchantFailedToLogin|MerchantLockedOut/i.test(msg) ? 401 : 500;
    return res.status(code).json({ error: msg });
  }
}