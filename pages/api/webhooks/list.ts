// pages/api/webhooks/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as PrismaExport from "@/lib/prisma";

const prisma: any = (PrismaExport as any).default ?? (PrismaExport as any).prisma ?? null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!prisma) return res.status(500).json({ error: "database unavailable" });
  const limit = Math.min(Number(req.query.limit ?? 100) || 100, 500);
  const rows = await prisma.webhookEvent.findMany({
    orderBy: { receivedAt: "desc" },
    take: limit,
    select: { id: true, kind: true, receivedAt: true, verified: true, note: true, payload: true },
  });
  res.status(200).json({ rows });
}
