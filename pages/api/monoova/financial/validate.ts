import type { NextApiRequest, NextApiResponse } from "next";
import { validateTransaction } from "@/lib/monoova/sdk";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const data = await validateTransaction(body);
  res.status(200).json(data);
}
