import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMonoova } from "@/lib/monoova/client";
import type { Mode } from "@/lib/monoova";
import { logTransaction } from "@/lib/monoova/logs";
import { P_FINANCIAL_STATUS } from "@/lib/monoova/paths";

function resolveMode(req: NextApiRequest): Mode {
  const v = req.cookies["env"]?.toUpperCase();
  if (v === "LIVE" || v === "MOCK") return v;
  return "SANDBOX";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uniqueReference } = req.query;
  if (!uniqueReference) return res.status(400).json({ error: "uniqueReference required" });

  const mode = resolveMode(req);
  const upstreamPath = `${P_FINANCIAL_STATUS}/${encodeURIComponent(String(uniqueReference))}`;
  const { status, headers, data } = await fetchMonoova(upstreamPath, { method: "GET" }, mode);

  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.status(status).json(data);

  await logTransaction({
    kind: "status-by-uid",
    mode,
    path: upstreamPath,
    httpStatus: status,
    responseBody: data,
  });
}
