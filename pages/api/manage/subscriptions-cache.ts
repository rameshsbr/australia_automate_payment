// pages/api/manage/subscriptions-cache.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

function envFromReq(req: NextApiRequest): "sandbox" | "live" {
  const q = String(req.query.env || "").toLowerCase();
  if (q === "live") return "live";
  if (q === "sandbox") return "sandbox";
  const c = String(req.cookies?.env || "").toLowerCase();
  return c === "live" ? "live" : "sandbox";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const env = envFromReq(req);
  const service = (req.query.service as string) || undefined;
  const where = { env, ...(service ? { service } : {}) };
  const rows = await prisma.subscriptionCache.findMany({ where, orderBy: [{ service: "asc" }, { subscriptionId: "asc" }] });
  return res.status(200).json({ rows });
}