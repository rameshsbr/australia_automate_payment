import type { NextApiRequest, NextApiResponse } from "next";
import * as PrismaExport from "@/lib/prisma";

// tolerate both default and named exports
const prisma: any =
  (PrismaExport as any).default ?? (PrismaExport as any).prisma ?? null;

async function dbCheck() {
  const started = Date.now();
  try {
    if (prisma) {
      // ❗ do NOT optional-chain a tagged template call
      await prisma.$queryRaw`SELECT 1`;
      // or: await prisma.$queryRawUnsafe("SELECT 1");
    }
    return { ok: true, ms: Date.now() - started };
  } catch (e: any) {
    return {
      ok: false,
      ms: Date.now() - started,
      error: e?.message || String(e),
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await dbCheck();
  const payload = {
    ok: db.ok,
    db,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      MODE: process.env.ENVIRONMENT,
      DB_URL: Boolean(process.env.DATABASE_URL),
    },
  };
  res.status(db.ok ? 200 : 500).json(payload);
}