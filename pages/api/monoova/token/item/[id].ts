import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { monoovaGetTokenDetails, monoovaDeleteToken, monoovaUpdateToken } from "@/lib/monoova/token";

const Env = z.enum(["sandbox", "live"]).default("sandbox");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = String(req.query.id || "").trim();
  if (!token) return res.status(400).json({ error: "token required" });

  try {
    const env = Env.parse(req.query.env ?? "sandbox");

    if (req.method === "GET") {
      const out = await monoovaGetTokenDetails(env, token);
      return res.status(200).json(out);
    }

    if (req.method === "DELETE") {
      const out = await monoovaDeleteToken(env, token);
      return res.status(200).json(out);
    }

    if (req.method === "PATCH" || req.method === "PUT") {
      const body = (req.body ?? {}) as any;
      const out = await monoovaUpdateToken(env, token, body);
      return res.status(200).json(out);
    }

    res.setHeader("Allow", "GET,DELETE,PATCH,PUT");
    return res.status(405).end();
  } catch (e: any) {
    const msg = e?.message || String(e);
    const code = /Unauthorized|MerchantFailedToLogin/i.test(msg) ? 401 : 500;
    return res.status(code).json({ error: msg });
  }
}