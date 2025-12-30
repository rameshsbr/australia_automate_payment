// pages/api/dev/webhooks/events/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as PrismaExport from "@/lib/prisma";
const prisma: any = (PrismaExport as any).default ?? (PrismaExport as any).prisma ?? null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!prisma) return res.status(500).json({ error: "DB not available" });
  if (req.method !== "GET") return res.status(405).end();

  const { id } = req.query as { id: string };
  const row = await prisma.webhookEvent.findUnique({
    where: { id },
    select: { id:true, kind:true, verified:true, note:true, receivedAt:true, payload:true },
  });
  if (!row) return res.status(404).json({ error: "Not found" });
  res.status(200).json({ row });
}