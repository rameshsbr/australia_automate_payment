// pages/api/monoova/account/[mAccount]/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  monoovaGetAccount,
  monoovaUpdateAccount,
  monoovaCloseAccount,
} from "@/lib/monoova/maccount";

const Env = z.enum(["sandbox", "live"]).default("sandbox");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const env = Env.parse((req.query.env as string) ?? "sandbox");
  const mAccount = String(req.query.mAccount || "").trim();
  if (!mAccount) return res.status(400).json({ error: "mAccount required" });

  try {
    if (req.method === "GET") {
      const out = await monoovaGetAccount(env, mAccount);
      return res.status(200).json(out);
    }

    if (req.method === "PATCH" || req.method === "PUT") {
      const Body = z
        .object({
          name: z.string().min(1).optional(),
          currency: z.string().optional(),
        })
        .passthrough();
      const body = Body.parse(req.body ?? {});
      const out = await monoovaUpdateAccount(env, mAccount, body);
      return res.status(200).json({ updated: true, account: out });
    }

    if (req.method === "DELETE") {
      const out = await monoovaCloseAccount(env, mAccount);
      return res.status(200).json({ closed: true, result: out });
    }

    res.setHeader("Allow", "GET,PATCH,PUT,DELETE");
    return res.status(405).end();
  } catch (e: any) {
    const msg = e?.message || String(e);
    const code = /Unauthorized|MerchantFailedToLogin/i.test(msg) ? 401 : 500;
    return res.status(code).json({ error: msg });
  }
}