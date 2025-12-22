import { prismaClient } from "@/lib/monoova/logs";

export async function recordWebhook(kind: string, payload: any, verified = false, note?: string) {
  try {
    await prismaClient.webhookEvent.create({
      data: {
        kind,
        payload: payload as any,
        verified,
        note,
      },
    });
  } catch (err) {
    console.error("WebhookEvent insert failed", err);
  }
}
