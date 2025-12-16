import { PrismaClient } from "@prisma/client";
import type { AppMode } from "@/lib/mode";

const g = global as unknown as {
  prismaSandbox?: PrismaClient;
  prismaLive?: PrismaClient;
};

function makeClient(url?: string) {
  if (!url) throw new Error("DATABASE_URL missing for selected mode");
  return new PrismaClient({ datasources: { db: { url } } });
}

export function getPrisma(mode: AppMode) {
  if (mode === "sandbox") {
    if (!g.prismaSandbox) g.prismaSandbox = makeClient(process.env.DATABASE_URL_SANDBOX);
    return g.prismaSandbox;
  }
  if (!g.prismaLive) g.prismaLive = makeClient(process.env.DATABASE_URL_LIVE);
  return g.prismaLive;
}
