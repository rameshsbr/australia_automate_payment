// pages/api/dev/audit-logs.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as PrismaExport from "@/lib/prisma";

const prisma: any = (PrismaExport as any).default ?? (PrismaExport as any).prisma ?? null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  if (!prisma) return res.status(500).json({ error: "Prisma not available" });

  const from = (req.query.from as string) || "";
  const to = (req.query.to as string) || "";
  const whereTL: any = {};
  const whereWH: any = {};

  if (from || to) {
    whereTL.createdAt = {};
    whereWH.receivedAt = {};
    if (from) { whereTL.createdAt.gte = new Date(from); whereWH.receivedAt.gte = new Date(from); }
    if (to)   { whereTL.createdAt.lte = new Date(to);   whereWH.receivedAt.lte = new Date(to);   }
  }

  // Group TransactionLog by path+status+kind for a quick operational overview
  const tl = await prisma.transactionLog.groupBy({
    by: ["path", "httpStatus", "kind"],
    where: whereTL,
    _count: { _all: true },
    _avg: { httpStatus: true },
  });

  // Group WebhookEvent by kind + verified flag
  const wh = await prisma.webhookEvent.groupBy({
    by: ["kind", "verified"],
    where: whereWH,
    _count: { _all: true },
  });

  res.status(200).json({ transactions: tl, webhooks: wh });
}