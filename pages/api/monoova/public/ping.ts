import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMonoova } from "@/lib/monoova/client";
import type { Mode } from "@/lib/monoova";
import { logTransaction } from "@/lib/monoova/logs";
import { P_PUBLIC_PING } from "@/lib/monoova/paths";

function resolveMode(req: NextApiRequest): Mode {
  const v = req.cookies["env"]?.toUpperCase();
  if (v === "LIVE" || v === "MOCK") return v;
  return "SANDBOX";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mode = resolveMode(req);
  const { status, headers, data } = await fetchMonoova(P_PUBLIC_PING, { method: "GET" }, mode);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.status(status).json(data);

  await logTransaction({
    kind: "public-ping",
    mode,
    path: P_PUBLIC_PING,
    httpStatus: status,
    responseBody: data,
  });
}
