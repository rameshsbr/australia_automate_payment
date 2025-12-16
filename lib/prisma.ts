// file: lib/prisma.ts
// WHY: two fully separate Prisma clients, one per environment, with proper caching in dev.

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma_live__: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __prisma_sandbox__: PrismaClient | undefined;
}

/** Create a PrismaClient with a specific URL. */
function createClient(url?: string): PrismaClient {
  if (!url) {
    throw new Error("Prisma URL missing: check DATABASE_URL_LIVE / DATABASE_URL_SANDBOX in .env");
  }
  return new PrismaClient({
    datasources: { db: { url } },
  });
}

/** Live client (uses DATABASE_URL_LIVE) */
export const prismaLive: PrismaClient =
  global.__prisma_live__ ??
  createClient(process.env.DATABASE_URL_LIVE);

if (process.env.NODE_ENV !== "production") {
  global.__prisma_live__ = prismaLive;
}

/** Sandbox client (uses DATABASE_URL_SANDBOX) */
export const prismaSandbox: PrismaClient =
  global.__prisma_sandbox__ ??
  createClient(process.env.DATABASE_URL_SANDBOX);

if (process.env.NODE_ENV !== "production") {
  global.__prisma_sandbox__ = prismaSandbox;
}

/** Helper if you need to branch on env at call-site */
export function prismaFor(env: "live" | "sandbox"): PrismaClient {
  return env === "live" ? prismaLive : prismaSandbox;
}