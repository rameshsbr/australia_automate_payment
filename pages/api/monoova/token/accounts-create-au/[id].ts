// pages/api/monoova/token/accounts-create-au/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { monoovaCreateBankAccountToken } from "@/lib/monoova/token";

const Env = z.enum(["sandbox", "live"]).default("sandbox");

const Body = z.object({
  bsb: z.string().regex(/^\d{6}$/, "BSB must be 6 digits"),
  accountNumber: z.string().regex(/^\d{5,20}$/, "Account number must be 5–20 digits"),
  accountName: z.string().optional(),
  nickname: z.string().optional(),
}).passthrough();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  try {
    const env = Env.parse(req.query.env ?? "sandbox");
    const mAccount = String(req.query.id || "").trim();
    if (!mAccount) return res.status(400).json({ error: "mAccount required" });

    const body = Body.parse(req.body ?? {});
    // If a future tenant requires mAccount, you’ll have it here.
    const out = await monoovaCreateBankAccountToken(env, body);
    return res.status(200).json(out);
  } catch (e: any) {
    const msg = e?.message || String(e);
    const is401 = /Unauthorized|MerchantFailedToLogin/i.test(msg);
    const isLocked = /MerchantLockedOut/i.test(msg);
    return res.status(is401 || isLocked ? 401 : 500).json({ error: msg });
  }
}