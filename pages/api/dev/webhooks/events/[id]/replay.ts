// pages/api/dev/webhooks/events/[id]/replay.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as PrismaExport from "@/lib/prisma";
const prisma: any = (PrismaExport as any).default ?? (PrismaExport as any).prisma ?? null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!prisma) return res.status(500).json({ error: "DB not available" });
  if (req.method !== "POST") return res.status(405).end();

  const { id } = req.query as { id: string };
  const { url, headers } = (await parseBody(req)) as { url: string; headers?: Record<string,string> };

  if (!/^https:\/\//i.test(url)) return res.status(400).json({ error: "Replay url must be HTTPS" });

  const row = await prisma.webhookEvent.findUnique({
    where: { id },
    select: { payload:true, kind:true },
  });
  if (!row) return res.status(404).json({ error: "Not found" });

  const h: Record<string,string> = {
    "content-type": "application/json",
    ...(headers || {}),
  };
  // tip: include your shared secret if you want to hit your own /provider again
  const resp = await fetch(url, { method: "POST", headers: h, body: JSON.stringify(row.payload ?? {}) } as any);
  const text = await resp.text().catch(()=> "");
  res.status(200).json({ status: resp.status, ok: resp.ok, body: text.slice(0, 2000) });
}

function parseBody(req: NextApiRequest) {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch { resolve({}); }
    });
  });
}