// pages/api/dev/webhooks/events.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as PrismaExport from "@/lib/prisma";

const prisma: any = (PrismaExport as any).default ?? (PrismaExport as any).prisma ?? null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!prisma) return res.status(500).json({ error: "DB not available" });
  if (req.method !== "GET") return res.status(405).end();

  const { kind, verified, q, limit = "50", before } = req.query as Record<string,string|undefined>;
  const where: any = {};
  if (kind) where.kind = kind.toLowerCase();
  if (verified === "true" || verified === "false") where.verified = verified === "true";
  if (q) where.note = { contains: q };

  const take = Math.min(Math.max(parseInt(String(limit) || "50", 10), 1), 200);
  const cursor = before ? { id: String(before) } : undefined;

  const rows = await prisma.webhookEvent.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor } : {}),
    select: { id:true, kind:true, verified:true, note:true, receivedAt:true },
  });
  res.status(200).json({ rows });
}