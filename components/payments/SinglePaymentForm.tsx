"use client";

import { useState } from "react";
import {
  PAYMENT_RAILS,
  RAIL_FIELD_GROUPS,
  buildMonoovaPayment,
  type Rail,
} from "@/lib/payments/normalize";

type Result = { ok: boolean; json: any } | null;

export default function SinglePaymentForm() {
  const [form, setForm] = useState({
    rail: "Direct Credit (DE)" as Rail,
    amount: "1.00",
    currency: "AUD",
    bsb: "062000",
    accountNumber: "12345678",
    accountName: "Demo",
    lodgementReference: "Test",
    payIdType: "Email",
    storedToken: "",
    billerCode: "",
    crn: "",
    mAccountNumber: "",
    payId: "",
  });
  const [submitting, setSubmitting] = useState<"validate" | "execute" | null>(null);
  const [result, setResult] = useState<Result>(null);

  const groups = RAIL_FIELD_GROUPS[form.rail];

  async function submit(kind: "validate" | "execute") {
    try {
      setSubmitting(kind);
      setResult(null);
      const callerUniqueReference =
        globalThis.crypto?.randomUUID?.() || `ui-${Date.now()}`;
      const body = buildMonoovaPayment({
        rail: form.rail,
        amount: form.amount,
        currency: form.currency,
        reference: form.lodgementReference,
        callerUniqueReference,
        source: { type: "mAccount" },
        fields:
          form.rail === "Direct Credit (DE)" || form.rail === "NPP – Bank Account"
            ? {
                bsb: form.bsb,
                accountNumber: form.accountNumber,
                accountName: form.accountName,
              }
            : form.rail === "NPP – PayID"
            ? {
                payId: form.payId,
                payIdType: form.payIdType,
                remitterName: form.accountName,
              }
            : form.rail === "BPAY"
            ? {
                billerCode: form.billerCode,
                crn: form.crn,
                billerName: form.accountName,
              }
            : form.rail === "Direct Credit (Token)" || form.rail === "Direct Debit (Token)"
            ? { token: form.storedToken }
            : {
                mAccountNumber: form.mAccountNumber,
              },
      });
      const res = await fetch(`/api/internal/payments/${kind}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      setResult({ ok: res.ok, json });
    } catch (e) {
      setResult({ ok: false, json: { error: String(e) } });
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
            onChange={(e) => setForm((prev) => ({ ...prev, rail: e.target.value as Rail }))}
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
              onChange={(e) =>
                setForm((prev) => ({ ...prev, currency: e.target.value }))
              }
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
              value={form.storedToken || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, storedToken: e.target.value }))}
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
              onChange={(e) => setForm((prev) => ({ ...prev, payIdType: e.target.value as any }))}
            >
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="ABN">ABN</option>
              <option value="OrgId">OrganisationId</option>
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
              value={form.accountName || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, accountName: e.target.value }))}
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
              value={form.mAccountNumber || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, mAccountNumber: e.target.value }))}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => submit("validate")}
          disabled={!!submitting}
          className="inline-flex items-center justify-center bg-[#6d44c9] rounded-lg h-9 px-4 text-sm text-white disabled:opacity-60"
        >
          {submitting === "validate" ? "Validating…" : "Validate"}
        </button>
        <button
          type="button"
          onClick={() => submit("execute")}
          disabled={!!submitting}
          className="inline-flex items-center justify-center bg-[#374151] rounded-lg h-9 px-4 text-sm text-white disabled:opacity-60"
        >
          {submitting === "execute" ? "Executing…" : "Execute"}
        </button>
      </div>

      {result && (
        <pre className="mt-3 max-h-80 overflow-auto rounded-lg border border-outline/40 bg-surface p-3 text-xs whitespace-pre-wrap">
{JSON.stringify(result.json, null, 2)}
        </pre>
      )}
    </div>
  );
}
