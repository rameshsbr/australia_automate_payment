import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMonoova } from "@/lib/monoova/client";
import { logTransaction } from "@/lib/monoova/logs";
import type { Mode } from "@/lib/monoova";
import { P_FINANCIAL_VALIDATE } from "@/lib/monoova/paths";

function resolveMode(req: NextApiRequest): Mode {
  const v = req.cookies["env"]?.toUpperCase();
  if (v === "LIVE" || v === "MOCK") return v;
  return "SANDBOX";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const mode = resolveMode(req);
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { status, headers, data } = await fetchMonoova(P_FINANCIAL_VALIDATE, { method: "POST", body }, mode);

  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.status(status).json(data);

  await logTransaction({
    kind: "validate",
    mode,
    path: P_FINANCIAL_VALIDATE,
    requestBody: body,
    responseBody: data,
    httpStatus: status,
  });
}
