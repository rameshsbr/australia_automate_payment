// pages/api/monoova/account/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { monoovaCreateAccount, monoovaListAccounts } from "@/lib/monoova/maccount";

const Env = z.enum(["sandbox", "live"]).default("sandbox");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const env = Env.parse(req.query.env ?? "sandbox");

    if (req.method === "GET") {
      const rows = await monoovaListAccounts(env);
      return res.status(200).json({ rows });
    }

    if (req.method === "POST") {
      const body = req.body ?? {};
      const out = await monoovaCreateAccount(env, body);
      return res.status(200).json(out);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).end();
  } catch (e: any) {
    return res.status(/Unauthorized|MerchantFailedToLogin/i.test(String(e)) ? 401 : 500)
      .json({ error: e?.message || String(e) });
  }
}