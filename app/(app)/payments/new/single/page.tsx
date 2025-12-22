"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Popover } from "@/components/ui";

type PaymentRail =
  | "directCredit"
  | "directDebit"
  | "tokenCredit"
  | "tokenDebit"
  | "nppBank"
  | "nppPayId"
  | "bpay"
  | "childCredit"
  | "childDebit";

type PayIdType = "Email" | "Phone" | "ABN" | "OrganisationId";

const RAIL_LABELS: Record<PaymentRail, string> = {
  directCredit: "Direct Credit (DE)",
  directDebit: "Direct Debit (DE)",
  tokenCredit: "DE token credit",
  tokenDebit: "DE token debit",
  nppBank: "NPP – Bank Account",
  nppPayId: "NPP – PayID",
  bpay: "BPAY",
  childCredit: "Pay child mAccount",
  childDebit: "Debit child mAccount",
};

export default function NewSinglePaymentPage() {
  const [rail, setRail] = useState<PaymentRail>("directCredit");
  const [showOptional, setShowOptional] = useState(false);

  const [callerUniqueReference, setCallerUniqueReference] = useState("demo-1");
  const [amount, setAmount] = useState("1.00");
  const [currency] = useState("AUD");
  const [bsbNumber, setBsbNumber] = useState("062000");
  const [accountNumber, setAccountNumber] = useState("12345678");
  const [accountName, setAccountName] = useState("Demo");
  const [lodgementReference, setLodgementReference] = useState("Test");
  const [remitterName, setRemitterName] = useState("Demo");
  const [token, setToken] = useState("");
  const [payId, setPayId] = useState("payid@example.com");
  const [payIdType, setPayIdType] = useState<PayIdType>("Email");
  const [billerCode, setBillerCode] = useState("123456");
  const [billerReference, setBillerReference] = useState("123456789");
  const [childMaccount, setChildMaccount] = useState("");

  const [payloadPreview, setPayloadPreview] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const railFields = useMemo(() => {
    switch (rail) {
      case "directCredit":
      case "directDebit":
        return (
          <div className="space-y-4 mt-4">
            <LabeledInput label="BSB" value={bsbNumber} onChange={setBsbNumber} />
            <LabeledInput label="Account number" value={accountNumber} onChange={setAccountNumber} />
            <LabeledInput label="Account name" value={accountName} onChange={setAccountName} />
            {showOptional && (
              <>
                <LabeledInput
                  label="Lodgement reference (optional)"
                  value={lodgementReference}
                  onChange={setLodgementReference}
                />
              </>
            )}
          </div>
        );
      case "tokenCredit":
      case "tokenDebit":
        return (
          <div className="space-y-4 mt-4">
            <LabeledInput label="Token" value={token} onChange={setToken} />
          </div>
        );
      case "nppBank":
        return (
          <div className="space-y-4 mt-4">
            <LabeledInput label="BSB" value={bsbNumber} onChange={setBsbNumber} />
            <LabeledInput label="Account number" value={accountNumber} onChange={setAccountNumber} />
            <LabeledInput label="Account name" value={accountName} onChange={setAccountName} />
            {showOptional && (
              <>
                <LabeledInput
                  label="Lodgement reference (optional)"
                  value={lodgementReference}
                  onChange={setLodgementReference}
                />
              </>
            )}
          </div>
        );
      case "nppPayId":
        return (
          <div className="space-y-4 mt-4">
            <LabeledInput label="PayID" value={payId} onChange={setPayId} />
            <LabeledSelect
              label="PayID type"
              value={payIdType}
              onChange={(v) => setPayIdType(v as PayIdType)}
              options={[
                { label: "Email", value: "Email" },
                { label: "Phone", value: "Phone" },
                { label: "ABN", value: "ABN" },
                { label: "OrganisationId", value: "OrganisationId" },
              ]}
            />
            {showOptional && (
              <>
                <LabeledInput
                  label="Remitter name (optional)"
                  value={remitterName}
                  onChange={setRemitterName}
                />
                <LabeledInput
                  label="Lodgement reference (optional)"
                  value={lodgementReference}
                  onChange={setLodgementReference}
                />
              </>
            )}
          </div>
        );
      case "bpay":
        return (
          <div className="space-y-4 mt-4">
            <LabeledInput label="Biller code" value={billerCode} onChange={setBillerCode} />
            <LabeledInput label="Customer reference" value={billerReference} onChange={setBillerReference} />
          </div>
        );
      case "childCredit":
      case "childDebit":
        return (
          <div className="space-y-4 mt-4">
            <LabeledInput
              label={rail === "childCredit" ? "Child mAccount number" : "Debit child mAccount"}
              value={childMaccount}
              onChange={setChildMaccount}
            />
          </div>
        );
      default:
        return null;
    }
  }, [rail, bsbNumber, accountNumber, accountName, showOptional, lodgementReference, token, payId, payIdType, remitterName, billerCode, billerReference, childMaccount]);

  const buildDisbursement = () => {
    const base = { type: "DE", amount, currency } as Record<string, any>;

    if (rail === "directCredit") {
      return {
        ...base,
        disbursementMethod: "DirectCredit",
        toDirectCreditDetails: compact({
          bsbNumber,
          accountNumber,
          accountName,
          lodgementReference,
        }),
      };
    }

    if (rail === "directDebit") {
      return {
        ...base,
        disbursementMethod: "DirectDebit",
        toDirectDebitDetails: compact({
          bsbNumber,
          accountNumber,
          accountName,
        }),
      };
    }

    if (rail === "tokenCredit") {
      return {
        ...base,
        toDirectCreditUsingTokenDetails: compact({ token }),
      };
    }

    if (rail === "tokenDebit") {
      return {
        ...base,
        toDirectDebitUsingTokenDetails: compact({ token }),
      };
    }

    if (rail === "nppBank") {
      return {
        ...base,
        toNppBankAccountDetails: compact({
          bsbNumber,
          accountNumber,
          accountName,
          lodgementReference,
        }),
      };
    }

    if (rail === "nppPayId") {
      return {
        ...base,
        toNppPayIdDetails: compact({
          payId,
          payIdType,
          remitterName,
          lodgementReference,
        }),
      };
    }

    if (rail === "bpay") {
      return {
        ...base,
        toBpayDetails: compact({ billerCode, crn: billerReference }),
      };
    }

    if (rail === "childCredit") {
      return {
        ...base,
        toChildMaccountDetails: compact({ mAccountNumber: childMaccount }),
      };
    }

    if (rail === "childDebit") {
      return {
        ...base,
        fromChildMaccountDetails: compact({ mAccountNumber: childMaccount }),
      };
    }

    return base;
  };

  const handleSubmit = async () => {
    const disbursement = buildDisbursement();
    const payload = {
      callerUniqueReference,
      source: { type: "mAccount" },
      disbursements: [disbursement],
    };

    setPayloadPreview(JSON.stringify(payload, null, 2));
    setSubmitting(true);
    setError("");
    setResult("");

    try {
      const resp = await fetch("/api/internal/payments/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await resp.text();
      setResult(text);
      if (!resp.ok) setError(`Request failed with ${resp.status}`);
    } catch (err: any) {
      setError(err?.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const OptionalSection = (
    <div className="mt-3">
      <button
        type="button"
        className="inline-flex items-center justify-between w-full bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm"
        onClick={() => setShowOptional((v) => !v)}
      >
        <span>Show optional fields</span>
        <span className="text-subt">{showOptional ? "▴" : "▾"}</span>
      </button>
    </div>
  );

  return (
    <>
      <div className="mb-2">
        <Link href="/payments/review" className="text-sm text-subt hover:underline">
          ← Payments
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-6">New single payment</h1>

      <div className="max-w-3xl bg-panel rounded-xl2 border border-outline/40 p-4 md:p-6 space-y-4">
        <section>
          <div className="text-sm font-medium mb-2">From</div>
          <div className="flex items-center justify-between bg-surface border border-outline/40 rounded-lg px-3 py-3">
            <div>
              <div className="text-sm">—</div>
              <div className="text-xs text-subt">—</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-subt">Available</div>
              <div className="text-sm">—</div>
            </div>
          </div>
        </section>

        <section>
          <div className="text-sm font-medium mb-2">Payment rail</div>
          <Popover
            className="w-[520px]"
            button={({ open }) => (
              <button
                type="button"
                className="w-full bg-surface border border-outline/40 rounded-lg h-10 px-3 text-left text-sm inline-flex items-center justify-between"
              >
                <span>{RAIL_LABELS[rail]}</span>
                <span className="text-subt ml-2">{open ? "▴" : "▾"}</span>
              </button>
            )}
          >
            <div className="text-sm">
              <div className="py-1">
                {(
                  [
                    "directCredit",
                    "directDebit",
                    "tokenCredit",
                    "tokenDebit",
                    "nppBank",
                    "nppPayId",
                    "bpay",
                    "childCredit",
                    "childDebit",
                  ] as PaymentRail[]
                ).map((key) => (
                  <DropdownRow key={key} label={RAIL_LABELS[key]} onClick={() => setRail(key)} />
                ))}
              </div>
            </div>
          </Popover>
        </section>

        <section className="space-y-4">
          <LabeledInput
            label="Caller unique reference"
            value={callerUniqueReference}
            onChange={setCallerUniqueReference}
            helper="Used to prevent duplicate payments"
          />
          <AmountInput label="Amount" value={amount} onChange={setAmount} currency={currency} />
          {railFields}
          {OptionalSection}
        </section>

        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/payments/review"
            className="inline-flex items-center justify-center bg-panel border border-outline/40 rounded-lg h-9 px-4 text-sm"
          >
            ← Back
          </Link>
          <button
            className="ml-auto inline-flex items-center justify-center bg-[#6d44c9] rounded-lg h-9 px-5 text-sm text-white disabled:opacity-60"
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Validate →"}
          </button>
        </div>

        {(payloadPreview || result || error) && (
          <div className="mt-4 space-y-3 text-sm">
            {payloadPreview && (
              <div>
                <div className="text-subt text-xs mb-1">Payload preview</div>
                <pre className="bg-surface border border-outline/40 rounded-lg p-3 text-xs whitespace-pre-wrap">{payloadPreview}</pre>
              </div>
            )}
            {result && (
              <div>
                <div className="text-subt text-xs mb-1">API response</div>
                <pre className="bg-surface border border-outline/40 rounded-lg p-3 text-xs whitespace-pre-wrap">{result}</pre>
              </div>
            )}
            {error && <div className="text-red-500">{error}</div>}
          </div>
        )}
      </div>
    </>
  );
}

function DropdownRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="w-full text-left px-2 py-2 rounded hover:bg-panel/60 flex items-center gap-2"
      onClick={onClick}
    >
      <span>{label}</span>
    </button>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  helper?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm mb-1">{label}</div>
      {helper && <div className="text-xs text-subt mb-2">{helper}</div>}
      <input
        className="w-full bg-surface border border-outline/40 rounded-lg h-10 px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block">
      <div className="text-sm mb-1">{label}</div>
      <select
        className="w-full bg-surface border border-outline/40 rounded-lg h-10 px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AmountInput({
  label,
  value,
  onChange,
  currency,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  currency: string;
}) {
  return (
    <label className="block">
      <div className="text-sm mb-1">{label}</div>
      <div className="flex items-center bg-surface border border-outline/40 rounded-lg h-10 px-2">
        <span className="px-2 text-subt">{currency}</span>
        <input
          className="flex-1 bg-transparent outline-none text-sm px-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
        />
      </div>
    </label>
  );
}

function compact<T extends Record<string, any>>(obj: T) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ""));
}
