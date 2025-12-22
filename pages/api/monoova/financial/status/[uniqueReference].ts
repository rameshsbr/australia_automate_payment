import type { NextApiRequest, NextApiResponse } from "next";
import { getStatusByUniqueRef } from "@/lib/monoova/sdk";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uniqueReference } = req.query;
  if (!uniqueReference) return res.status(400).json({ error: "uniqueReference required" });
  const data = await getStatusByUniqueRef(String(uniqueReference));
  res.status(200).json(data);
}
