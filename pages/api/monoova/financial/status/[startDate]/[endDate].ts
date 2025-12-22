import type { NextApiRequest, NextApiResponse } from "next";
import { getStatusByDate } from "@/lib/monoova/sdk";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) return res.status(400).json({ error: "startDate/endDate required" });
  const data = await getStatusByDate(String(startDate), String(endDate));
  res.status(200).json(data);
}
