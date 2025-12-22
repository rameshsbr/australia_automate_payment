"use client";

import { useMemo, useState } from "react";
import type { Rail } from "@/lib/payments/normalize";
import { buildFinancialRequest } from "@/lib/monoova/build";

type FormState = {
  rail: Rail;
  amount: string;
  currency: string;
  bsb: string;
  accountNumber: string;
  accountName: string;
  payIdAccountName: string;
  lodgementReference: string;
  payIdType: "Email" | "Phone" | "ABN" | "OrganisationId";
  token: string;
  billerCode: string;
  crn: string;
  billerName: string;
  payId: string;
  callerUniqueReference: string;
  sourceType: "mAccount" | "mWallet";
  mAccountToken: string;
  mWalletId: string;
  mWalletPin: string;
};

type RailFieldGroup = "deBank" | "token" | "payId" | "bpay";

const PAYMENT_RAILS: { id: Rail; label: string }[] = [
  { id: "DIRECT_CREDIT_DE", label: "Direct Credit (DE)" },
  { id: "DIRECT_CREDIT_TOKEN", label: "Direct Credit (Token)" },
  { id: "NPP_BANK", label: "NPP – Bank Account" },
  { id: "NPP_PAYID", label: "NPP – PayID" },
  { id: "BPAY", label: "BPAY" },
];

const RAIL_FIELD_GROUPS: Record<Rail, RailFieldGroup[]> = {
  DIRECT_CREDIT_DE: ["deBank"],
  DIRECT_CREDIT_TOKEN: ["token"],
  NPP_BANK: ["deBank"],
  NPP_PAYID: ["payId"],
  BPAY: ["bpay"],
};

const PAYID_TYPES: { id: FormState["payIdType"]; label: string }[] = [
  { id: "Email", label: "Email" },
  { id: "Phone", label: "Phone" },
  { id: "ABN", label: "ABN" },
  { id: "OrganisationId", label: "Organisation ID" },
];

type Result = string | null;

export default function SinglePaymentForm() {
  const [form, setForm] = useState<FormState>(() => ({
    rail: "DIRECT_CREDIT_DE",
    amount: "1.00",
    currency: "AUD",
    bsb: "062000",
    accountNumber: "12345678",
    accountName: "Demo",
    payIdAccountName: "Demo Recipient",
    lodgementReference: "Test",
    payIdType: "Email",
    token: "",
    billerCode: "",
    crn: "",
    billerName: "",
    payId: "",
    sourceType: "mAccount",
    mAccountToken: "",
    mWalletId: "",
    mWalletPin: "",
    callerUniqueReference: globalThis.crypto?.randomUUID?.() || `ui-${Date.now()}`,
  }));
  const [submitting, setSubmitting] = useState<"validate" | "execute" | null>(null);
  const [result, setResult] = useState<Result>(null);

  const groups = RAIL_FIELD_GROUPS[form.rail];

  const prettyResult = useMemo(() => {
    if (!result) return null;
    try {
      return JSON.stringify(JSON.parse(result), null, 2);
    } catch (e) {
      return result;
    }
  }, [result]);

  function buildPayload(): Monoova.FinancialTransactionRequest {
    const paymentSource: Monoova.PaymentSource =
      form.rail === "BPAY" || form.sourceType === "mWallet" ? "mWallet" : "mAccount";

    if (paymentSource === "mAccount" && !form.mAccountToken) {
      throw new Error("mAccount token is required");
    }
    if (paymentSource === "mWallet" && (!form.mWalletId || !form.mWalletPin)) {
      throw new Error("mWallet token and pin are required");
    }

    const disbursementMethod =
      form.rail === "DIRECT_CREDIT_DE"
        ? "directcredit"
        : form.rail === "DIRECT_CREDIT_TOKEN"
          ? "token"
          : form.rail === "NPP_BANK"
            ? "nppcreditbankaccount"
            : form.rail === "NPP_PAYID"
              ? "nppcreditpayid"
              : "bpay";

    const payload = buildFinancialRequest({
      totalAmount: form.amount,
      paymentSource,
      uniqueReference: form.callerUniqueReference,
      description: form.lodgementReference || undefined,
      mAccountToken: form.mAccountToken,
      mWalletToken: form.mWalletId,
      mWalletPin: form.mWalletPin,
      disbursements: [
        {
          method: disbursementMethod as any,
          amount: form.amount,
          toDirectCreditDetails:
            form.rail === "DIRECT_CREDIT_DE"
              ? {
                  bsbNumber: form.bsb,
                  accountNumber: form.accountNumber,
                  accountName: form.accountName,
                  lodgementReference: form.lodgementReference || undefined,
                }
              : undefined,
          toNppCreditBankAccountDetails:
            form.rail === "NPP_BANK"
              ? {
                  bsbNumber: form.bsb,
                  accountNumber: form.accountNumber,
                  accountName: form.accountName,
                  lodgementReference: form.lodgementReference || undefined,
                }
              : undefined,
          toNppCreditPayIdDetails:
            form.rail === "NPP_PAYID"
              ? {
                  payId: form.payId,
                  payIdType: form.payIdType,
                  accountName: form.payIdAccountName,
                  remitterName: form.payIdAccountName,
                  lodgementReference: form.lodgementReference || undefined,
                }
              : undefined,
          toBPayDetails:
            form.rail === "BPAY"
              ? {
                  billerCode: form.billerCode,
                  referenceNumber: form.crn,
                  billerName: form.billerName || undefined,
                }
              : undefined,
          toToken: form.rail === "DIRECT_CREDIT_TOKEN" ? form.token : undefined,
        },
      ],
    });

    return payload as Monoova.FinancialTransactionRequest;
  }

  async function post(path: "/api/monoova/financial/validate" | "/api/monoova/financial/execute") {
    try {
      setSubmitting(path.includes("validate") ? "validate" : "execute");
      setResult(null);

      const payload = buildPayload();

      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const txt = await res.text();
      setResult(txt);
    } catch (e) {
      setResult(String(e));
    } finally {
      setSubmitting(null);
    }
  }

  const cx = "w-full bg-surface border border-outline/40 rounded-lg h-10 px-3 text-sm";
  const label = "text-xs text-subt mb-1 block";
  const row = "grid grid-cols-1 md:grid-cols-2 gap-3";

  return (
    <div className="space-y-4">
      <div className={row}>
        <div>
          <label className={label}>Payment rail</label>
          <select
            className={cx}
            value={form.rail}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                rail: e.target.value as Rail,
                sourceType: e.target.value === "BPAY" ? "mWallet" : "mAccount",
              }))
            }
          >
            {PAYMENT_RAILS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Amount</label>
            <input
              className={cx}
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>Currency</label>
            <input
              className={cx}
              value={form.currency}
              onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {form.sourceType === "mAccount" && form.rail !== "BPAY" && (
        <div className={row}>
          <div>
            <label className={label}>mAccount token</label>
            <input
              className={cx}
              value={form.mAccountToken}
              onChange={(e) => setForm((prev) => ({ ...prev, mAccountToken: e.target.value }))}
            />
          </div>
        </div>
      )}

      {groups.includes("deBank") && (
        <div className={row}>
          <div>
            <label className={label}>BSB</label>
            <input
              className={cx}
              value={form.bsb || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, bsb: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>Account number</label>
            <input
              className={cx}
              value={form.accountNumber || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>Account name / Remitter</label>
            <input
              className={cx}
              value={form.accountName || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, accountName: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>Lodgement reference</label>
            <input
              className={cx}
              value={form.lodgementReference || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, lodgementReference: e.target.value }))}
            />
          </div>
        </div>
      )}

      {groups.includes("token") && (
        <div className={row}>
          <div>
            <label className={label}>Stored token</label>
            <input
              className={cx}
              value={form.token || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, token: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>Lodgement reference</label>
            <input
              className={cx}
              value={form.lodgementReference || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, lodgementReference: e.target.value }))}
            />
          </div>
        </div>
      )}

      {groups.includes("payId") && (
        <div className={row}>
          <div>
            <label className={label}>PayID</label>
            <input
              className={cx}
              value={form.payId || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, payId: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>PayID type</label>
            <select
              className={cx}
              value={form.payIdType || "Email"}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, payIdType: e.target.value as FormState["payIdType"] }))
              }
            >
              {PAYID_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Account name (required)</label>
            <input
              className={cx}
              value={form.payIdAccountName || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, payIdAccountName: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>Lodgement reference</label>
            <input
              className={cx}
              value={form.lodgementReference || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, lodgementReference: e.target.value }))}
            />
          </div>
        </div>
      )}

      {groups.includes("bpay") && (
        <div className={row}>
          <div className="md:col-span-2 flex items-center gap-4">
            <label className={label + " mb-0"}>Source</label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="bpay-source"
                value="mAccount"
                checked={form.sourceType === "mAccount"}
                onChange={() => setForm((prev) => ({ ...prev, sourceType: "mAccount" }))}
              />
              mAccount (not allowed for BPAY)
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="bpay-source"
                value="mWallet"
                checked={form.sourceType === "mWallet"}
                onChange={() => setForm((prev) => ({ ...prev, sourceType: "mWallet" }))}
              />
              mWallet (required)
            </label>
          </div>
          {form.sourceType === "mWallet" && (
            <>
              <div>
                <label className={label}>mWallet token</label>
                <input
                  className={cx}
                  value={form.mWalletId}
                  onChange={(e) => setForm((prev) => ({ ...prev, mWalletId: e.target.value }))}
                />
              </div>
              <div>
                <label className={label}>PIN</label>
                <input
                  className={cx}
                  type="password"
                  value={form.mWalletPin}
                  onChange={(e) => setForm((prev) => ({ ...prev, mWalletPin: e.target.value }))}
                />
              </div>
            </>
          )}
          <div>
            <label className={label}>Biller code</label>
            <input
              className={cx}
              value={form.billerCode || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, billerCode: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>CRN / Reference number</label>
            <input
              className={cx}
              value={form.crn || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, crn: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Biller name (optional)</label>
            <input
              className={cx}
              value={form.billerName || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, billerName: e.target.value }))}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => post("/api/monoova/financial/validate")}
          disabled={!!submitting}
          className="inline-flex items-center justify-center bg-[#6d44c9] rounded-lg h-9 px-4 text-sm text-white disabled:opacity-60"
        >
          {submitting === "validate" ? "Validating…" : "Validate"}
        </button>
        <button
          type="button"
          onClick={() => post("/api/monoova/financial/execute")}
          disabled={!!submitting}
          className="inline-flex items-center justify-center bg-[#374151] rounded-lg h-9 px-4 text-sm text-white disabled:opacity-60"
        >
          {submitting === "execute" ? "Executing…" : "Execute"}
        </button>
      </div>

      {prettyResult && (
        <pre className="mt-3 max-h-80 overflow-auto rounded-lg border border-outline/40 bg-surface p-3 text-xs whitespace-pre-wrap">
{prettyResult}
        </pre>
      )}
    </div>
  );
}
