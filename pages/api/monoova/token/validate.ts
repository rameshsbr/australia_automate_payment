import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { monoovaValidateToken } from "@/lib/monoova/token";

const Env = z.enum(["sandbox", "live"]).default("sandbox");
// Keep liberal input: typically { token, bsb?, accountNumber?, amount? }
const Body = z.object({}).passthrough();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") { res.setHeader("Allow","POST"); return res.status(405).end(); }
  try {
    const env = Env.parse(req.query.env ?? "sandbox");
    const body = Body.parse(req.body ?? {});
    const out = await monoovaValidateToken(env, body);
    res.status(200).json(out);
  } catch (e: any) {
    const msg = e?.message || String(e);
    const is401 = /Unauthorized|MerchantFailedToLogin/i.test(msg);
    const isLocked = /MerchantLockedOut/i.test(msg);
    const code = is401 || isLocked ? 401 : 500;
    res.status(code).json({ error: msg });
  }
}