import type { NextApiRequest, NextApiResponse } from "next";
import { publicPing } from "@/lib/monoova/sdk";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = await publicPing();
  res.status(200).json(data);
}
