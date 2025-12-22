import type { NextApiRequest, NextApiResponse } from "next";
import { executeTransaction } from "@/lib/monoova/sdk";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const data = await executeTransaction(body);
  res.status(200).json(data);
}
