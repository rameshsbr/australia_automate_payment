// pages/api/dev/logs.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as PrismaExport from "@/lib/prisma";

const prisma: any = (PrismaExport as any).default ?? (PrismaExport as any).prisma ?? null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  if (!prisma) return res.status(500).json({ error: "Prisma not available" });

  const getNum = (v: any, d: number) => (Number.isFinite(+v) ? +v : d);
  const take = Math.min(Math.max(getNum(req.query.limit, 100), 1), 200);

  const where: any = {};
  const q = (req.query.q as string)?.trim();
  const path = (req.query.path as string)?.trim();
  const mode = (req.query.mode as string)?.trim();
  const kind = (req.query.kind as string)?.trim();
  const status = req.query.status ? Number(req.query.status) : undefined;
  const from = (req.query.from as string)?.trim();
  const to = (req.query.to as string)?.trim();

  if (mode) where.mode = mode;
  if (kind) where.kind = kind;
  if (Number.isFinite(status)) where.httpStatus = status;
  if (path) where.path = { contains: path, mode: "insensitive" };
  if (q) {
    where.OR = [
      { path: { contains: q, mode: "insensitive" } },
      { kind: { contains: q, mode: "insensitive" } },
    ];
  }
  if (from || to) where.createdAt = {};
  if (from) where.createdAt.gte = new Date(from);
  if (to) where.createdAt.lte = new Date(to);

  // Try to order by createdAt, fall back to id if the column doesn't exist.
  const tryOrder = async () => {
    try {
      return await prisma.transactionLog.findMany({
        where,
        orderBy: { createdAt: "desc" } as any,
        take,
        select: {
          id: true,
          createdAt: true,
          kind: true,
          mode: true,
          path: true,
          httpStatus: true,
          requestBody: true,
          responseBody: true,
          redactions: true,
        },
      });
    } catch {
      return await prisma.transactionLog.findMany({
        where,
        orderBy: { id: "desc" } as any,
        take,
        select: {
          id: true,
          // createdAt may be missing in this fallback
          kind: true,
          mode: true,
          path: true,
          httpStatus: true,
          requestBody: true,
          responseBody: true,
          redactions: true,
        },
      });
    }
  };

  const rows = await tryOrder();
  res.status(200).json({ rows });
}