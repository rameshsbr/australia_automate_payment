// pages/api/monoova/account/[mAccount]/statement.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { monoovaSendStatement } from "@/lib/monoova/maccount";

const Env = z.enum(["sandbox", "live"]).default("sandbox");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const env = Env.parse((req.query.env as string) ?? "sandbox");
  const mAccount = String(req.query.mAccount || "").trim();
  if (!mAccount) return res.status(400).json({ error: "mAccount required" });

  try {
    const Body = z.object({
      toEmail: z.string().email(),
      fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      format: z.enum(["pdf", "csv"]).optional(),
    });
    const body = Body.parse(req.body ?? {});
    const out = await monoovaSendStatement(env, mAccount, body);
    return res.status(200).json({ sent: true, result: out });
  } catch (e: any) {
    const msg = e?.message || String(e);
    const code = /Unauthorized|MerchantFailedToLogin/i.test(msg) ? 401 : 500;
    return res.status(code).json({ error: msg });
  }
}