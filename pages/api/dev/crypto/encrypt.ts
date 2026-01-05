import type { NextApiRequest, NextApiResponse } from "next";
import { encryptForMonoova } from "@/lib/monoova/crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mode = (String(req.query.env || "sandbox").toLowerCase() === "live" ? "live" : "sandbox") as "live"|"sandbox";
  const txt = String(req.query.plain || "hello-monoova");
  try {
    const outB64 = await encryptForMonoova(txt, mode);
    res.status(200).json({ ciphertextB64: outB64, len: outB64.length });
  } catch (e:any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}