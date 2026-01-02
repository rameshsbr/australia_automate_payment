// pages/api/monoova/security/change-password.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { monoovaChangePassword } from "@/lib/monoova/security";

const Env = z.enum(["sandbox", "live"]).default("sandbox");
const Body = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end(); }
  try {
    const env = Env.parse(req.query.env ?? "sandbox");
    const body = Body.parse(req.body ?? {});
    const out = await monoovaChangePassword(env, body);
    return res.status(200).json(out);
  } catch (e: any) {
    const msg = e?.message || String(e);
    const code = /Unauthorized|MerchantFailedToLogin/i.test(msg) ? 401 : 500;
    return res.status(code).json({ error: msg });
  }
}