"use client";

import { useMemo, useState } from "react";

type Rail =
  | "de_credit"
  | "de_debit"
  | "de_token_credit"
  | "de_token_debit"
  | "npp_bank"
  | "npp_payid"
  | "bpay"
  | "maccount_child_pay"
  | "maccount_child_debit";

const railOptions: { value: Rail; label: string }[] = [
  { value: "de_credit", label: "Direct Credit (DE)" },
  { value: "de_debit", label: "Direct Debit (DE)" },
  { value: "de_token_credit", label: "Direct Credit (Token)" },
  { value: "de_token_debit", label: "Direct Debit (Token)" },
  { value: "npp_bank", label: "NPP – Bank Account" },
  { value: "npp_payid", label: "NPP – PayID" },
  { value: "bpay", label: "BPAY" },
  { value: "maccount_child_pay", label: "Pay child mAccount" },
  { value: "maccount_child_debit", label: "Debit child mAccount" },
];

type Result = { ok: boolean; json: any } | null;

export default function SinglePaymentForm() {
  const [amount, setAmount] = useState("1.00");
  const [currency, setCurrency] = useState("AUD");
  const [reference, setReference] = useState("Test lodgement");
  const [rail, setRail] = useState<Rail>("de_credit");
  const [bsb, setBsb] = useState("062000");
  const [accountNumber, setAccountNumber] = useState("12345678");
  const [accountName, setAccountName] = useState("Demo");
  const [token, setToken] = useState("");
  const [payId, setPayId] = useState("");
  const [payIdType, setPayIdType] = useState<"Email" | "Phone" | "ABN" | "OrganisationId">("Email");
  const [billerCode, setBillerCode] = useState("");
  const [crn, setCrn] = useState("");
  const [childMAccount, setChildMAccount] = useState("");
  const [submitting, setSubmitting] = useState<"validate" | "execute" | null>(null);
  const [result, setResult] = useState<Result>(null);

  const showBankFields = rail === "de_credit" || rail === "de_debit" || rail === "npp_bank";
  const showTokenField = rail === "de_token_credit" || rail === "de_token_debit";
  const showPayIdFields = rail === "npp_payid";
  const showBpayFields = rail === "bpay";
  const showChildMAccount = rail === "maccount_child_pay" || rail === "maccount_child_debit";

  const payload = useMemo(() => {
    const base = {
      callerUniqueReference: `ui-${Date.now()}`,
      source: { type: "mAccount" as const },
      disbursements: [] as any[],
    };

    if (rail === "de_credit") {
      base.disbursements.push({
        type: "DE",
        amount,
        currency,
        details: {
          bsb,
          accountNumber,
          remitterName: accountName,
          reference,
        },
      });
    }

    if (rail === "de_debit") {
      base.disbursements.push({
        type: "DE",
        disbursementMethod: "DirectDebit",
        amount,
        currency,
        toDirectDebitDetails: {
          bsbNumber: bsb,
          accountNumber,
          accountName,
        },
      });
    }

    if (rail === "de_token_credit") {
      base.disbursements.push({
        type: "DE",
        amount,
        currency,
        toDirectCreditUsingTokenDetails: { token },
      });
    }

    if (rail === "de_token_debit") {
      base.disbursements.push({
        type: "DE",
        amount,
        currency,
        toDirectDebitUsingTokenDetails: { token },
      });
    }

    if (rail === "npp_bank") {
      base.disbursements.push({
        type: "DE",
        amount,
        currency,
        toNppBankAccountDetails: {
          bsbNumber: bsb,
          accountNumber,
          accountName,
          lodgementReference: reference,
        },
      });
    }

    if (rail === "npp_payid") {
      base.disbursements.push({
        type: "DE",
        amount,
        currency,
        toNppPayIdDetails: {
          payId,
          payIdType,
          remitterName: accountName,
          lodgementReference: reference,
        },
      });
    }

    if (rail === "bpay") {
      base.disbursements.push({
        type: "DE",
        amount,
        currency,
        toBpayDetails: {
          billerCode,
          crn,
          billerName: accountName || undefined,
        },
      });
    }

    if (rail === "maccount_child_pay") {
      base.disbursements.push({
        type: "DE",
        amount,
        currency,
        toChildMaccountDetails: { mAccountNumber: childMAccount },
      });
    }

    if (rail === "maccount_child_debit") {
      base.disbursements.push({
        type: "DE",
        amount,
        currency,
        fromChildMaccountDetails: { mAccountNumber: childMAccount },
      });
    }

    return base;
  }, [
    rail,
    amount,
    currency,
    bsb,
    accountNumber,
    accountName,
    reference,
    token,
    payId,
    payIdType,
    billerCode,
    crn,
    childMAccount,
  ]);

  async function submit(kind: "validate" | "execute") {
    try {
      setSubmitting(kind);
      setResult(null);
      const res = await fetch(`/api/internal/payments/${kind}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
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
            value={rail}
            onChange={(e) => setRail(e.target.value as Rail)}
          >
            {railOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Amount</label>
            <input className={cx} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className={label}>Currency</label>
            <input className={cx} value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </div>
        </div>
      </div>

      {showBankFields && (
        <div className={row}>
          <div>
            <label className={label}>BSB</label>
            <input className={cx} value={bsb} onChange={(e) => setBsb(e.target.value)} />
          </div>
          <div>
            <label className={label}>Account number</label>
            <input
              className={cx}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Account name / Remitter</label>
            <input
              className={cx}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Lodgement reference</label>
            <input
              className={cx}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        </div>
      )}

      {showTokenField && (
        <div className={row}>
          <div>
            <label className={label}>Stored token</label>
            <input className={cx} value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
        </div>
      )}

      {showPayIdFields && (
        <div className={row}>
          <div>
            <label className={label}>PayID</label>
            <input className={cx} value={payId} onChange={(e) => setPayId(e.target.value)} />
          </div>
          <div>
            <label className={label}>PayID type</label>
            <select
              className={cx}
              value={payIdType}
              onChange={(e) => setPayIdType(e.target.value as any)}
            >
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="ABN">ABN</option>
              <option value="OrganisationId">OrganisationId</option>
            </select>
          </div>
          <div>
            <label className={label}>Remitter name</label>
            <input
              className={cx}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Lodgement reference</label>
            <input
              className={cx}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        </div>
      )}

      {showBpayFields && (
        <div className={row}>
          <div>
            <label className={label}>Biller code</label>
            <input
              className={cx}
              value={billerCode}
              onChange={(e) => setBillerCode(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>CRN</label>
            <input className={cx} value={crn} onChange={(e) => setCrn(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Biller name (optional)</label>
            <input
              className={cx}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>
        </div>
      )}

      {showChildMAccount && (
        <div className={row}>
          <div>
            <label className={label}>Child mAccount number</label>
            <input
              className={cx}
              value={childMAccount}
              onChange={(e) => setChildMAccount(e.target.value)}
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
