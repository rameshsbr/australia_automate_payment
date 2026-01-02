// lib/monoova/maccount.ts
// Thin upstream wrapper with safe defaults + env overrides for paths.

export type Env = "sandbox" | "live";

const reqd = (k: string, v?: string) => {
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
};

function base(env: Env) {
  return env === "sandbox"
    ? reqd("MONOOVA_BASE_SANDBOX", process.env.MONOOVA_BASE_SANDBOX)
    : reqd("MONOOVA_BASE_LIVE", process.env.MONOOVA_BASE_LIVE);
}

function basic(env: Env) {
  const user =
    env === "sandbox"
      ? reqd("SANDBOX_MACCOUNT", process.env.SANDBOX_MACCOUNT)
      : reqd("LIVE_MACCOUNT", process.env.LIVE_MACCOUNT);
  const pass =
    env === "sandbox"
      ? reqd("MONOOVA_API_KEY_SANDBOX", process.env.MONOOVA_API_KEY_SANDBOX)
      : reqd("MONOOVA_API_KEY_LIVE", process.env.MONOOVA_API_KEY_LIVE);
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

async function call(env: Env, path: string, init: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${base(env)}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: basic(env),
      ...(init.headers as any),
    },
  } as any);

  const text = await res.text();
  let body: any = undefined;
  try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }

  if (!res.ok) {
    const msg = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`Upstream ${res.status} ${res.statusText}: ${msg}`);
  }
  return body;
}

/**
 * Path overrides (support both your names and mine):
 *  - MONOOVA_PATH_ACCOUNT_LIST or MONOOVA_PATH_ACCOUNT_LISTASISSUER
 *  - MONOOVA_PATH_ACCOUNT_GET
 *  - MONOOVA_PATH_ACCOUNT_BALANCE or MONOOVA_PATH_ACCOUNT_FINANCIALS
 *  - MONOOVA_PATH_ACCOUNT_TXNS
 *  - MONOOVA_PATH_ACCOUNT_CREATE
 *  - MONOOVA_PATH_ACCOUNT_UPDATE
 *  - MONOOVA_PATH_ACCOUNT_CLOSE
 *  - MONOOVA_PATH_ACCOUNT_STATEMENT or MONOOVA_PATH_ACCOUNT_SENDSTATEMENT
 */
const PATHS = {
  LIST:
    process.env.MONOOVA_PATH_ACCOUNT_LIST ??
    process.env.MONOOVA_PATH_ACCOUNT_LISTASISSUER ??
    "/maccount/v1/listasissuer",

  GET: (m: string) =>
    (process.env.MONOOVA_PATH_ACCOUNT_GET ?? "/maccount/v1/get/{mAccount}")
      .replace("{mAccount}", encodeURIComponent(m)),

  FINANCIALS: (m: string) =>
    (process.env.MONOOVA_PATH_ACCOUNT_BALANCE ??
     process.env.MONOOVA_PATH_ACCOUNT_FINANCIALS ??
     "/maccount/v1/financials/{mAccount}")
      .replace("{mAccount}", encodeURIComponent(m)),

  TXNS:
    process.env.MONOOVA_PATH_ACCOUNT_TXNS ??
    "/maccount/v1/transactions",

  CREATE:
    process.env.MONOOVA_PATH_ACCOUNT_CREATE ??
    "/maccount/v1/create",

  UPDATE:
    process.env.MONOOVA_PATH_ACCOUNT_UPDATE ??
    "/maccount/v1/update",

  // 🔧 CHANGED: make CLOSE a placeholder-aware function defaulting to /close/{mAccount}
  CLOSE: (m: string) =>
    (process.env.MONOOVA_PATH_ACCOUNT_CLOSE ??
     "/maccount/v1/close/{mAccount}")
      .replace("{mAccount}", encodeURIComponent(m)),

  SENDSTATEMENT:
    process.env.MONOOVA_PATH_ACCOUNT_STATEMENT ??
    process.env.MONOOVA_PATH_ACCOUNT_SENDSTATEMENT ??
    "/maccount/v1/sendstatement",
};

// ---------- List as issuer ----------
export async function monoovaListAccounts(env: Env) {
  const data = await call(env, PATHS.LIST, { method: "GET" });
  const items = Array.isArray(data?.accounts) ? data.accounts : (Array.isArray(data) ? data : []);
  return items.map((a: any) => ({
    mAccount: String(a?.mAccount ?? a?.accountNumber ?? ""),
    name: a?.name ?? a?.accountName ?? "",
    currency: a?.currency ?? "AUD",
    raw: a,
  })).filter((x: any) => x.mAccount);
}

// ---------- Get account details ----------
export async function monoovaGetAccount(env: Env, mAccount: string) {
  const data = await call(env, PATHS.GET(mAccount), { method: "GET" });
  return { mAccount, raw: data };
}

// ---------- Get balance ----------
export async function monoovaGetBalance(env: Env, mAccount: string) {
  const data = await call(env, PATHS.FINANCIALS(mAccount), { method: "GET" });
  const cents = (v: any) => Math.round(Number(v ?? 0) * 100);
  return {
    mAccount,
    availableCents: data?.availableCents ?? cents(data?.available ?? data?.availableBalance),
    ledgerCents: data?.ledgerCents ?? cents(data?.ledger ?? data?.ledgerBalance),
    currency: data?.currency ?? "AUD",
    raw: data,
  };
}

// ---------- Get transactions (range, optional paging/direction) ----------
export async function monoovaGetTransactions(
  env: Env,
  mAccount: string,
  startYMD: string,
  endYMD: string,
  opts?: { direction?: "credit" | "debit"; cursor?: string; pageSize?: number }
) {
  const body: Record<string, any> = {
    accountnumber: mAccount,
    frequency: "custom",
    startdate: startYMD,
    enddate: endYMD,
  };
  if (opts?.direction) body.direction = opts.direction;
  if (opts?.cursor) body.cursor = opts.cursor;
  if (opts?.pageSize) body.pageSize = Math.min(200, Math.max(1, opts.pageSize));

  const data = await call(env, PATHS.TXNS, { method: "POST", body: JSON.stringify(body) });

  const rows = Array.isArray(data?.transactions) ? data.transactions : (Array.isArray(data) ? data : data?.items ?? []);
  const nextCursor = data?.nextCursor ?? data?.cursor?.next ?? null;

  return {
    rows: rows.map((t: any, i: number) => ({
      id: String(t?.id ?? t?.txnId ?? t?.transactionId ?? `row-${i}`),
      postedAt: t?.postedAt ?? t?.date ?? t?.createdDate ?? null,
      description: t?.description ?? t?.narrative ?? "",
      amountCents: t?.amountCents ?? Math.round(Number(t?.amount ?? 0) * 100),
      currency: t?.currency ?? "AUD",
      direction: String(t?.direction ?? (Number(t?.amount ?? 0) >= 0 ? "credit" : "debit")).toLowerCase(),
      raw: t,
    })),
    nextCursor,
    raw: data,
  };
}

// ---------- Create mAccount ----------
export async function monoovaCreateAccount(env: Env, payload: any) {
  const data = await call(env, PATHS.CREATE, { method: "POST", body: JSON.stringify(payload) });
  return { raw: data };
}

// ---------- Update mAccount ----------
export async function monoovaUpdateAccount(env: Env, mAccount: string, payload: any) {
  const body = { mAccount, ...payload };
  const data = await call(env, PATHS.UPDATE, { method: "POST", body: JSON.stringify(body) });
  return { raw: data };
}

// ---------- Close mAccount ----------
export async function monoovaCloseAccount(env: Env, mAccount: string) {
  // Prefer GET /maccount/v1/close/{mAccount}; fallback to legacy POST /maccount/v1/close with body.
  const rawTmpl = process.env.MONOOVA_PATH_ACCOUNT_CLOSE ?? "/maccount/v1/close/{mAccount}";
  if (rawTmpl.includes("{mAccount}")) {
    const path = rawTmpl.replace("{mAccount}", encodeURIComponent(mAccount));
    const data = await call(env, path, { method: "GET" });
    return { raw: data };
  } else {
    const data = await call(env, rawTmpl, { method: "POST", body: JSON.stringify({ mAccount }) });
    return { raw: data };
  }
}

// ---------- Send statement ----------
export async function monoovaSendStatement(env: Env, mAccount: string, payload: any) {
  // Accept either payload shape and send both sets of keys to be tenant-tolerant.
  const out = {
    // id fields
    mAccount,
    accountnumber: mAccount,

    // email fields
    email: payload?.email ?? payload?.toEmail,
    toEmail: payload?.toEmail ?? payload?.email,

    // date fields
    statementFromDate: payload?.statementFromDate ?? payload?.fromDate,
    statementToDate: payload?.statementToDate ?? payload?.toDate,

    // passthroughs
    format: payload?.format,
    ...payload,
  };

  const data = await call(env, PATHS.SENDSTATEMENT, { method: "POST", body: JSON.stringify(out) });
  return { raw: data };
}