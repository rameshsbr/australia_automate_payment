"use client";

import { useMemo, useState } from "react";
import { normalizeToMonoovaPayload, type RailKey } from "@/lib/payments/normalize";

type FormState = {
  rail: RailKey;
  amount: string;
  currency: string;
  bsb: string;
  accountNumber: string;
  accountName: string;
  lodgementReference: string;
  payIdType: "Email" | "Mobile" | "ABN" | "OrganisationId" | "Username";
  token: string;
  billerCode: string;
  crn: string;
  billerName: string;
  childMaccountNumber: string;
  payId: string;
  callerUniqueReference: string;
};

type RailFieldGroup = "deBank" | "token" | "payId" | "bpay" | "child";

const PAYMENT_RAILS: { id: RailKey; label: string }[] = [
  { id: "DE_DIRECT_CREDIT", label: "Direct Credit (DE)" },
  { id: "DE_DIRECT_CREDIT_TOKEN", label: "Direct Credit (Token)" },
  { id: "DE_DIRECT_DEBIT_TOKEN", label: "Direct Debit (Token)" },
  { id: "NPP_BANK", label: "NPP – Bank Account" },
  { id: "NPP_PAYID", label: "NPP – PayID" },
  { id: "BPAY", label: "BPAY" },
  { id: "PAY_CHILD", label: "Pay Child mAccount" },
  { id: "DEBIT_CHILD", label: "Debit Child mAccount" },
];

const RAIL_FIELD_GROUPS: Record<RailKey, RailFieldGroup[]> = {
  DE_DIRECT_CREDIT: ["deBank"],
  DE_DIRECT_CREDIT_TOKEN: ["token"],
  DE_DIRECT_DEBIT_TOKEN: ["token"],
  NPP_BANK: ["deBank"],
  NPP_PAYID: ["payId"],
  BPAY: ["bpay"],
  PAY_CHILD: ["child"],
  DEBIT_CHILD: ["child"],
};

const PAYID_TYPES: { id: FormState["payIdType"]; label: string }[] = [
  { id: "Email", label: "Email" },
  { id: "Mobile", label: "Mobile" },
  { id: "ABN", label: "ABN" },
  { id: "OrganisationId", label: "Organisation ID" },
  { id: "Username", label: "Username" },
];

type Result = string | null;

export default function SinglePaymentForm() {
  const [form, setForm] = useState<FormState>(() => ({
    rail: "DE_DIRECT_CREDIT",
    amount: "1.00",
    currency: "AUD",
    bsb: "062000",
    accountNumber: "12345678",
    accountName: "Demo",
    lodgementReference: "Test",
    payIdType: "Email",
    token: "",
    billerCode: "",
    crn: "",
    billerName: "",
    childMaccountNumber: "",
    payId: "",
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

  async function post(path: "/api/internal/payments/validate" | "/api/internal/payments/execute") {
    try {
      setSubmitting(path.includes("validate") ? "validate" : "execute");
      setResult(null);

      const payload = normalizeToMonoovaPayload({
        callerUniqueReference: form.callerUniqueReference,
        sourceType: "mAccount",
        amount: form.amount,
        currency: form.currency as "AUD",
        rail: form.rail,
        lodgementReference: form.lodgementReference,
        accountName: form.accountName,
        bsbNumber: form.bsb,
        accountNumber: form.accountNumber,
        payId: form.payId,
        payIdType: form.payIdType,
        token: form.token,
        billerCode: form.billerCode,
        crn: form.crn,
        billerName: form.billerName,
        mAccountNumber: form.childMaccountNumber,
      });

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
            onChange={(e) => setForm((prev) => ({ ...prev, rail: e.target.value as RailKey }))}
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
            <label className={label}>Remitter name</label>
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

      {groups.includes("bpay") && (
        <div className={row}>
          <div>
            <label className={label}>Biller code</label>
            <input
              className={cx}
              value={form.billerCode || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, billerCode: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>CRN</label>
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

      {groups.includes("child") && (
        <div className={row}>
          <div>
            <label className={label}>Child mAccount number</label>
            <input
              className={cx}
              value={form.childMaccountNumber || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, childMaccountNumber: e.target.value }))
              }
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

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => post("/api/internal/payments/validate")}
          disabled={!!submitting}
          className="inline-flex items-center justify-center bg-[#6d44c9] rounded-lg h-9 px-4 text-sm text-white disabled:opacity-60"
        >
          {submitting === "validate" ? "Validating…" : "Validate"}
        </button>
        <button
          type="button"
          onClick={() => post("/api/internal/payments/execute")}
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
