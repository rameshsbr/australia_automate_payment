import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMonoova } from "@/lib/monoova/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const mode = (req.cookies["env"]?.toUpperCase() as "MOCK" | "SANDBOX" | "LIVE") || "SANDBOX";
  const parts = ([] as string[]).concat((req.query.params as string[] | undefined) ?? []);

  // Build upstream path based on how many segments we got
  let upstreamPath: string;
  if (parts.length === 1) {
    // /api/monoova/financial/status/<uniqueReference>
    const [uniqueReference] = parts;
    upstreamPath = `/financial/v2/transaction/status/${encodeURIComponent(uniqueReference)}`;
  } else if (parts.length === 2) {
    // /api/monoova/financial/status/<startDate>/<endDate>
    const [startDate, endDate] = parts;
    upstreamPath = `/financial/v2/transaction/status/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`;
  } else {
    return res.status(400).json({
      error:
        "Use /api/monoova/financial/status/<uniqueReference> OR /api/monoova/financial/status/<startDate>/<endDate>",
    });
  }

  const { status, headers, data } = await fetchMonoova(upstreamPath, { method: "GET" }, mode);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v as string));
  return res.status(status).json(data);
}