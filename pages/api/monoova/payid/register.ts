import type { NextApiRequest, NextApiResponse } from "next";
import { payIdRegister } from "@/lib/monoova/payid";
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
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const payload = {
      payId: b.payId ?? b.alias,
      payIdName: b.payIdName ?? b.displayName,
      bsb: (b.bsb ? String(b.bsb).replace(/\D/g, "") : undefined),
      bankAccountNumber: b.bankAccountNumber,
    };
    if (!payload.payId) return res.status(400).json({ error: "payId is required (email address)" });
    if (!payload.payIdName) return res.status(400).json({ error: "payIdName is required (display name)" });
    if (!payload.bankAccountNumber) return res.status(400).json({ error: "bankAccountNumber is required" });

    const out = await payIdRegister(env, payload);

    const db = registryClient();
    if (db) {
      await db.upsert({
        where: { env_payId: { env, payId: payload.payId } },
        create: {
          env,
          payId: payload.payId,
          payIdName: payload.payIdName,
          bsb: payload.bsb ?? null,
          bankAccountNumber: payload.bankAccountNumber,
          status: "Active",
          raw: out,
        },
        update: {
          payIdName: payload.payIdName,
          bsb: payload.bsb ?? null,
          bankAccountNumber: payload.bankAccountNumber,
          status: "Active",
          raw: out,
        },
      });
    }

    res.status(200).json(out);
  } catch (e: any) {
    res.status(502).json({ error: e?.message || String(e) });
  }
}