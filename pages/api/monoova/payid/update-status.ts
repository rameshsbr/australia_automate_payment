import type { NextApiRequest, NextApiResponse } from "next";
import { payIdUpdateStatus } from "@/lib/monoova/payid";
import prisma from "@/lib/prisma";

type Mode = "sandbox" | "live";
function resolveMode(req: NextApiRequest): Mode {
  const q = String(req.query.env || "").toLowerCase();
  if (q === "live") return "live";
  if (q === "sandbox") return "sandbox";
  const c = String(req.cookies?.env || "").toLowerCase();
  return c === "live" ? "live" : "sandbox";
}

function registryClient() {
  const p: any = prisma as any;
  return p.payIdRegistry || p.payIDRegistry || p.PayIdRegistry || p.PayIDRegistry;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end(); }

  try {
    const env = resolveMode(req);
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    const payId = body.payId;
    let bsb: string | undefined = body.bsb ? String(body.bsb).replace(/\D/g, "") : undefined;
    let bankAccountNumber: string | undefined = body.bankAccountNumber ? String(body.bankAccountNumber) : undefined;
    const status = body.status; // "Active" | "Disabled"

    if (!payId) return res.status(400).json({ error: "payId is required" });
    if (!status || !["Active", "Disabled"].includes(status)) {
      return res.status(400).json({ error: "status must be 'Active' or 'Disabled'" });
    }

    // If not provided, look up from mirror
    const db = registryClient();
    if ((!bankAccountNumber || !bsb) && db) {
      const rec = await db.findUnique({ where: { env_payId: { env, payId } } });
      if (rec) {
        bankAccountNumber = bankAccountNumber || rec.bankAccountNumber || undefined;
        bsb = bsb || rec.bsb || undefined;
      }
    }

    if (!bankAccountNumber) return res.status(400).json({ error: "bankAccountNumber is required" });

    const out = await payIdUpdateStatus(env, { payId, bankAccountNumber, bsb, status });

    // mirror
    if (db) {
      await db.upsert({
        where: { env_payId: { env, payId } },
        create: {
          env,
          payId,
          payIdName: "", // unchanged here
          bsb: bsb ?? null,
          bankAccountNumber,
          status,
          raw: out,
        },
        update: { bsb: bsb ?? null, bankAccountNumber, status, raw: out },
      });
    }

    res.status(200).json(out);
  } catch (e: any) {
    res.status(502).json({ error: e?.message || String(e) });
  }
}