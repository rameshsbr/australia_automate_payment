// pages/api/monoova/payid/[id]/delete.ts
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
  if (!["POST","DELETE"].includes(String(req.method))) {
    res.setHeader("Allow", "POST,DELETE");
    return res.status(405).end();
  }
  try {
    const env = resolveMode(req);
    const payId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!payId) return res.status(400).json({ error: "id (payId) is required" });

    const db = registryClient();

    // Parse body (optional bankAccountNumber / bsb)
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    let bankAccountNumber: string | undefined = body.bankAccountNumber ? String(body.bankAccountNumber) : undefined;
    // Normalise BSB to digits only if provided
    let bsb: string | undefined = body.bsb ? String(body.bsb).replace(/\D/g, "") : undefined;

    // Look up from our mirror if anything is missing
    const rec = db ? await db.findUnique({ where: { env_payId: { env, payId } } }) : null;
    if (!bankAccountNumber && rec?.bankAccountNumber) bankAccountNumber = rec.bankAccountNumber;
    if (!bsb && rec?.bsb) bsb = String(rec.bsb).replace(/\D/g, "");

    if (!bankAccountNumber) {
      return res.status(400).json({
        error: "bankAccountNumber is required (we look it up from DB; provide in body if missing)"
      });
    }

    // Disable the PayID upstream
    const out = await payIdUpdateStatus(env, {
      payId,
      bankAccountNumber,
      bsb,            // may be undefined; upstream accepts it
      status: "Disabled",
    });

    // Keep your original behaviour: remove the mirror record after disabling
    if (db) {
      await db.delete({ where: { env_payId: { env, payId } } }).catch(() => {});
    }

    res.status(200).json(out);
  } catch (e: any) {
    res.status(502).json({ error: e?.message || String(e) });
  }
}