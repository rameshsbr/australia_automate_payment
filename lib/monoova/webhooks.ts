// lib/monoova/webhooks.ts
import crypto from "crypto";
import * as PrismaExport from "@/lib/prisma";

// tolerant prisma import
const prisma: any = (PrismaExport as any).default ?? (PrismaExport as any).prisma ?? null;

export function sha256Hex(input: string | Buffer): string {
  const h = crypto.createHash("sha256");
  h.update(typeof input === "string" ? Buffer.from(input, "utf8") : input);
  return h.digest("hex");
}

/**
 * Record a webhook event safely; tolerant to missing DB during dev.
 * Stores a fingerprint inside `note` to help dedupe/debug (format: "fp:<hex>").
 */
export async function recordWebhook(kind: string, payload: any, raw?: Buffer) {
  const fp = raw ? sha256Hex(raw) : sha256Hex(JSON.stringify(payload ?? {}));
  if (!prisma) return { id: null, fp };

  try {
    const dup = await prisma.webhookEvent.findFirst({
      where: { note: { contains: fp } },
      orderBy: { receivedAt: "desc" },
    });
    if (dup) return { id: dup.id, fp, duplicate: true };

    const created = await prisma.webhookEvent.create({
      data: { kind: String(kind || "unknown").toLowerCase(), verified: true, payload, note: `fp:${fp}` },
      select: { id: true },
    });
    return { id: created?.id, fp, duplicate: false };
  } catch {
    return { id: null, fp };
  }
}
