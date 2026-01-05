import type { NextApiRequest, NextApiResponse } from "next";
import { payIdEnquiry } from "@/lib/monoova/payid";

type Mode = "sandbox" | "live";
function resolveMode(req: NextApiRequest): Mode {
  const q = String(req.query.env || "").toLowerCase();
  if (q === "live") return "live";
  if (q === "sandbox") return "sandbox";
  const c = String(req.cookies?.env || "").toLowerCase();
  return c === "live" ? "live" : "sandbox";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const env = resolveMode(req);
  try {
    const out = await payIdEnquiry(env, "healthcheck@example.com");
    res.status(200).json({ ok: true, out });
  } catch (e: any) {
    res.status(200).json({ ok: false, error: e?.message || String(e) });
  }
}