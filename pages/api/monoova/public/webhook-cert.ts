// pages/api/monoova/public/webhook-cert.ts
import type { NextApiRequest, NextApiResponse } from "next";

type Mode = "sandbox" | "live";

function resolveMode(req: NextApiRequest): Mode {
  const q = String(req.query.env || "").toLowerCase();
  if (q === "live") return "live";
  if (q === "sandbox") return "sandbox";
  const c = String(req.cookies?.env || "").toLowerCase();
  return c === "live" ? "live" : "sandbox";
}

function trimHost(h: string) {
  return h.replace(/\.$/, "");
}

function basesFor(mode: Mode): string[] {
  const publicBase =
    mode === "live" ? process.env.MONOOVA_PUBLIC_BASE_LIVE : process.env.MONOOVA_PUBLIC_BASE_SANDBOX;

  // Fallbacks that commonly expose /public/*
  const defaults = [
    "https://api.mpay.com.au",
    "https://api.m-pay.com.au",
    "https://public.mpay.com.au",
  ];

  const out = new Set<string>();
  if (publicBase) out.add(trimHost(publicBase));
  defaults.forEach((b) => out.add(trimHost(b)));
  return Array.from(out);
}

const ABS_OVERRIDE = process.env.MONOOVA_PATH_PUBLIC_WEBHOOK_CERT; // may be absolute URL

const PATHS = [
  "/public/v2/webhookSigningCertificate",
  "/public/v2/webhooksSigningCertificate",
  "/public/v1/webhookSigningCertificate",
  "/public/v1/webhooksSigningCertificate",
  "/public/webhookSigningCertificate",
  "/public/webhooksSigningCertificate",
];

function withEnvQuery(path: string, mode: Mode): string[] {
  const envWord = mode === "live" ? "Live" : "Sandbox";
  const qs = ["", `?environment=${envWord}`, `?Environment=${envWord}`, `?env=${envWord}`, `?mode=${envWord}`];
  return qs.map((q) => `${path}${q}`);
}

function headerVariants(mode: Mode): Array<Record<string, string>> {
  const envWord = mode === "live" ? "Live" : "Sandbox";
  const key = process.env.MONOOVA_PUBLIC_SUBSCRIPTION_KEY?.trim();
  const withKey = key ? [{ "Ocp-Apim-Subscription-Key": key }] : [{}];
  // multiply by env header variants
  return withKey.flatMap((k) => [
    { ...k },
    { ...k, Environment: envWord },
    { ...k, environment: envWord },
  ]);
}

async function fetchFirstOk(bases: string[], mode: Mode, override?: string) {
  const tried: string[] = [];

  // Absolute URL short-circuit
  if (override && /^https?:\/\//i.test(override)) {
    const url = trimHost(override);
    tried.push(url);
    try {
      const r = await fetch(url, {
        headers: {
          Accept: "application/pkix-cert, application/octet-stream, text/plain, */*;q=0.2",
          ...(process.env.MONOOVA_PUBLIC_SUBSCRIPTION_KEY
            ? { "Ocp-Apim-Subscription-Key": process.env.MONOOVA_PUBLIC_SUBSCRIPTION_KEY }
            : {}),
        },
        cache: "no-store",
      });
      if (r.ok) return { url, res: r };
    } catch {}
  }

  const rels: string[] = [];
  if (override && !/^https?:\/\//i.test(override)) rels.push(...withEnvQuery(override, mode));
  PATHS.forEach((p) => rels.push(...withEnvQuery(p, mode)));

  for (const base of bases) {
    for (const rel of rels) {
      for (const hdrs of headerVariants(mode)) {
        const url = new URL(rel, base).toString();
        tried.push(url);
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 7000);
        try {
          const r = await fetch(url, {
            headers: { Accept: "application/pkix-cert, application/octet-stream, text/plain, */*;q=0.2", ...hdrs },
            cache: "no-store",
            signal: controller.signal,
          });
          clearTimeout(t);
          if (r.ok) return { url, res: r };
        } catch {
          clearTimeout(t);
          // swallow and continue
        }
      }
    }
  }
  return { tried };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mode = resolveMode(req);
  const bases = basesFor(mode);
  const attempt = await fetchFirstOk(bases, mode, ABS_OVERRIDE);

  if (!("res" in attempt)) {
    return res.status(404).json({
      status: 404,
      message: "Webhook signing certificate endpoint not found on any base/path combination tried.",
      tried: attempt.tried,
    });
  }

  const upstream = attempt.res;
  const buf = Buffer.from(await upstream.arrayBuffer());

  res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
  res.setHeader("Content-Disposition", upstream.headers.get("content-disposition") || "attachment; filename=monoova-signing-cert.cer");
  res.status(200).send(buf);
}