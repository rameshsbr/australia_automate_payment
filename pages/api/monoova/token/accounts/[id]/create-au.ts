import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { monoovaCreateBankAccountToken } from "@/lib/monoova/token";
const Env = z.enum(["sandbox", "live"]).default("sandbox");

const Body = z.object({
  bsb: z.string().min(6),
  accountNumber: z.string().min(5),
  accountName: z.string().optional(),
  nickname: z.string().optional(),
}).passthrough();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") { res.setHeader("Allow","POST"); return res.status(405).end(); }
  try {
    const env = Env.parse(req.query.env ?? "sandbox");
    const body = Body.parse(req.body ?? {});
    const out = await monoovaCreateBankAccountToken(env, body);
    res.status(200).json(out);
  } catch (e: any) {
    const msg = e?.message || String(e);
    res.status(/Unauthorized|MerchantFailedToLogin/i.test(msg) ? 401 : 500).json({ error: msg });
  }
}