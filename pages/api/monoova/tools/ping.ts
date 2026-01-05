import type { NextApiRequest, NextApiResponse } from "next";
import { monoovaToolsPing } from "@/lib/monoova/tools";

type Mode = "sandbox" | "live";
function resolveMode(req: NextApiRequest): Mode {
  const q = String(req.query.env || "").toLowerCase();
  if (q === "live") return "live";
  if (q === "sandbox") return "sandbox";
  const c = String(req.cookies?.env || "").toLowerCase();
  return c === "live" ? "live" : "sandbox";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).end(); }
  try {
    const mode = resolveMode(req);
    const out = await monoovaToolsPing(mode);
    res.status(200).json(out);
  } catch (e: any) {
    res.status(502).json({ error: e?.message || String(e) });
  }
}