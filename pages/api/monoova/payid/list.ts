import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

type Mode = "sandbox" | "live";
function resolveMode(req: NextApiRequest): Mode {
  const q = String(req.query.env || "").toLowerCase();
  if (q === "live") return "live";
  if (q === "sandbox") return "sandbox";
  const c = String(req.cookies?.env || "").toLowerCase();
  return c === "live" ? "live" : "sandbox";
}

function registryClient() {
  const p: any = prisma as any;
  return p.payIdRegistry || p.payIDRegistry || p.PayIdRegistry || p.PayIDRegistry;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).end(); }
  try {
    const env = resolveMode(req);
    const db = registryClient();
    const rows = db ? await db.findMany({ where: { env }, orderBy: { createdAt: "desc" } }) : [];
    res.status(200).json({ rows });
  } catch (e: any) {
    res.status(502).json({ error: e?.message || String(e) });
  }
}