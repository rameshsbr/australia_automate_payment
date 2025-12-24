// file: lib/prisma.ts
// WHY: separate clients for live/sandbox + a generic `prisma` for routes that use DATABASE_URL.
//      We expose both default and named `prisma` to satisfy all import styles.

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma_live__: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __prisma_sandbox__: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __prisma_generic__: PrismaClient | undefined;
}

/** Create a PrismaClient with a specific URL (overrides datasource). */
function createClient(url?: string): PrismaClient {
  if (!url) {
    throw new Error(
      "Prisma URL missing: set DATABASE_URL / DATABASE_URL_LIVE / DATABASE_URL_SANDBOX in .env"
    );
  }
  return new PrismaClient({ datasources: { db: { url } } });
}

/** Live client (uses DATABASE_URL_LIVE) */
export const prismaLive: PrismaClient =
  global.__prisma_live__ ?? createClient(process.env.DATABASE_URL_LIVE);

if (process.env.NODE_ENV !== "production") {
  global.__prisma_live__ = prismaLive;
}

/** Sandbox client (uses DATABASE_URL_SANDBOX) */
export const prismaSandbox: PrismaClient =
  global.__prisma_sandbox__ ?? createClient(process.env.DATABASE_URL_SANDBOX);

if (process.env.NODE_ENV !== "production") {
  global.__prisma_sandbox__ = prismaSandbox;
}

/** Generic client (uses DATABASE_URL) — many routes expect `prisma` (default/named). */
const prismaGeneric: PrismaClient =
  global.__prisma_generic__ ?? createClient(process.env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  global.__prisma_generic__ = prismaGeneric;
}

/** Helper to choose a client at call-site by env string. */
export function prismaFor(env: "live" | "sandbox"): PrismaClient {
  return env === "live" ? prismaLive : prismaSandbox;
}

/** Export a `prisma` symbol + default export for compatibility. */
export const prisma = prismaGeneric;
export default prismaGeneric;
