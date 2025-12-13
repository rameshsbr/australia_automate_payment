import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const config = { api: { bodyParser: false } };

function readBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve) => {
    let data = ""; req.on("data", (c) => (data += c)); req.on("end", () => resolve(data));
  });
}

// WHY: Validate with shared secret to trust provider webhooks.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const raw = await readBody(req);
  const signature = req.headers["x-webhook-signature"];
  if (signature !== env.webhookSecret) return res.status(401).end();

  const json = JSON.parse(raw);
  await prisma.webhookEvent.create({
    data: {
      organizationId: (await prisma.organization.findFirst())!.id,
      environment: (req.cookies["env"] as any) ?? "SANDBOX",
      topic: json.type ?? "unknown",
      payload: json
    }
  });
  res.status(200).json({ received: true });
}
