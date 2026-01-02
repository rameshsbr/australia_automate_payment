import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { receivablesNpp, receivablesPayto, receivablesRtgsImt } from "@/lib/monoova/reports";

const Env = z.enum(["sandbox", "live"]).default("sandbox");
const Type = z.enum(["npp", "payto", "rtgs-imt"]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const env = Env.parse(req.query.env ?? "sandbox");
    const type = Type.parse(req.query.type);
    const startDate = String(req.query.startDate || "");
    const endDate = String(req.query.endDate || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return res.status(400).json({ error: "startDate/endDate must be YYYY-MM-DD" });
    }

    const data =
      type === "npp" ? await receivablesNpp(env as any, startDate, endDate)
    : type === "payto" ? await receivablesPayto(env as any, startDate, endDate)
    : await receivablesRtgsImt(env as any, startDate, endDate);

    res.status(200).json({ report: data });
  } catch (e: any) {
    const msg = e?.message || String(e);
    const code = /Unauthorized|MerchantFailedToLogin/i.test(msg) ? 401 : 500;
    res.status(code).json({ error: msg });
  }
}