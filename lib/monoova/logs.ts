import { PrismaClient } from "@prisma/client";

const globalAny = global as unknown as { __prisma_default__?: PrismaClient };

export const prismaClient: PrismaClient =
  globalAny.__prisma_default__ ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalAny.__prisma_default__ = prismaClient;
}

type RedactionMap = Record<string, string>;

function redactSecrets<T>(value: T): { sanitized: any; redactions: RedactionMap } {
  const redactions: RedactionMap = {};
  const visit = (v: any): any => {
    if (!v || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.map(visit);
    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) {
      if (["pin"].includes(k)) {
        out[k] = "***";
        redactions[k] = "***";
      } else if (["token"].includes(k)) {
        out[k] = typeof val === "string" && val.length > 8 ? `${val.slice(0, 4)}***` : "***";
        redactions[k] = "***";
      } else {
        out[k] = visit(val);
      }
    }
    return out;
  };
  return { sanitized: visit(value), redactions };
}

export async function logTransaction(opts: {
  kind: string;
  mode: string;
  path: string;
  requestBody?: any;
  responseBody?: any;
  httpStatus: number;
}) {
  try {
    const reqRedaction = redactSecrets(opts.requestBody);
    const resRedaction = redactSecrets(opts.responseBody);
    const combinedRedactions = { ...reqRedaction.redactions, ...resRedaction.redactions };

    await prismaClient.transactionLog.create({
      data: {
        kind: opts.kind,
        mode: opts.mode,
        path: opts.path,
        requestBody: reqRedaction.sanitized as any,
        responseBody: resRedaction.sanitized as any,
        httpStatus: opts.httpStatus,
        redactions: Object.keys(combinedRedactions).length ? combinedRedactions : null,
      },
    });
  } catch (err) {
    // swallow logging errors to avoid breaking API responses
    console.error("TransactionLog failed", err);
  }
}
