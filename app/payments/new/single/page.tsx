"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/chrome";
import { Popover } from "@/components/ui";

/** One-time transfer choices (top of the dropdown) */
type ToType = "bank" | "bpay" | "monoova" | undefined;

/** Minimal payees list plumbing (kept empty by default).
 *  When you hook data later, populate this from API.
 */
type Payee = {
  id: string;
  kind: "bank" | "bpay" | "monoova";
  label: string;
  sublabel?: string;
};
const PAYEES: Payee[] = []; // ← leave empty per your instruction

export default function NewSinglePaymentPage() {
  const [toType, setToType] = useState<ToType>(undefined);
  const [showOptional, setShowOptional] = useState(false);

  // ------- Shared form state (kept empty) -------
  // Bank
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankBsb, setBankBsb] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [bankDesc, setBankDesc] = useState("");
  const [bankUniqueRef, setBankUniqueRef] = useState("");
  const [bankLodgementRef, setBankLodgementRef] = useState("");
  const [bankRemitter, setBankRemitter] = useState("");

  // BPAY
  const [bpayCode, setBpayCode] = useState("");
  const [bpayRef, setBpayRef] = useState("");
  const [bpayAmount, setBpayAmount] = useState("");
  const [bpayDesc, setBpayDesc] = useState("");
  const [bpayUniqueRef, setBpayUniqueRef] = useState("");
  const [bpayLodgementRef, setBpayLodgementRef] = useState("");
  const [bpayRemitter, setBpayRemitter] = useState("");

  // Monoova account
  const [maccId, setMaccId] = useState("");
  const [maccAmount, setMaccAmount] = useState("");
  const [maccDesc, setMaccDesc] = useState("");
  const [maccUniqueRef, setMaccUniqueRef] = useState("");
  const [maccLodgementRef, setMaccLodgementRef] = useState("");
  const [maccRemitter, setMaccRemitter] = useState("");

  const onPickTo = (kind: ToType) => setToType(kind);

  // Optional drawer is shared between forms
  const OptionalSection = (
    <>
      <button
        type="button"
        className="mt-3 inline-flex items-center justify-between w-full bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm"
        onClick={() => setShowOptional((v) => !v)}
      >
        <span>Show optional fields</span>
        <span className="text-subt">{showOptional ? "▴" : "▾"}</span>
      </button>

      {showOptional && (
        <div className="mt-3 space-y-4">
          {/* These inputs are rendered by each form with its own state */}
          {/* The labels + helper copy match your screenshots */}
        </div>
      )}
    </>
  );

  return (
    <AppShell>
      {/* Back crumb (top-left) */}
      <div className="mb-2">
        <Link href="/payments/review" className="text-sm text-subt hover:underline">
          ← Payments
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-6">New single payment</h1>

      {/* Main card */}
      <div className="max-w-3xl bg-panel rounded-xl2 border border-outline/40 p-4 md:p-6">
        {/* FROM */}
        <section className="mb-4">
          <div className="text-sm font-medium mb-2">From</div>
          <div className="flex items-center justify-between bg-surface border border-outline/40 rounded-lg px-3 py-3">
            {/* Keep data empty for now; wire it later */}
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

        {/* TO PICKER */}
        <section className="mb-4">
          <div className="text-sm font-medium mb-2">To</div>

          <Popover
            className="w-[520px]"
            button={({ open }) => (
              <button
                type="button"
                className="w-full bg-surface border border-outline/40 rounded-lg h-10 px-3 text-left text-sm inline-flex items-center justify-between"
              >
                <span className={toType ? "" : "text-subt/70"}>
                  {toType === "bank" && "Bank account"}
                  {toType === "bpay" && "Bpay biller"}
                  {toType === "monoova" && "Monoova account"}
                  {!toType && "Select an item"}
                </span>
                <span className="text-subt ml-2">{open ? "▴" : "▾"}</span>
              </button>
            )}
          >
            <div className="text-sm">
              <div className="px-2 pt-2 pb-1 text-subt uppercase tracking-wide text-[11px]">
                One time transfer
              </div>
              <div className="py-1">
                <DropdownRow label="Bank account" icon="🏦" onClick={() => onPickTo("bank")} />
                <DropdownRow label="Bpay biller" icon="🅱️" onClick={() => onPickTo("bpay")} />
                <DropdownRow label="Monoova account" icon="〽️" onClick={() => onPickTo("monoova")} />
              </div>

              <div className="px-2 pt-3 pb-1 text-subt uppercase tracking-wide text-[11px]">
                Payees
              </div>
              <div className="py-1">
                {PAYEES.length === 0 && (
                  <div className="px-2 py-2 text-subt text-xs">No payees yet</div>
                )}
                {PAYEES.map((p) => (
                  <button
                    key={p.id}
                    className="w-full text-left px-2 py-2 rounded hover:bg-panel/60 flex items-center gap-2"
                    onClick={() => onPickTo(p.kind)}
                  >
                    <span className="text-lg">👤</span>
                    <div>
                      <div className="text-sm">{p.label}</div>
                      {p.sublabel && <div className="text-xs text-subt">{p.sublabel}</div>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Popover>
        </section>

        {/* FORMS */}
        {toType === "bank" && (
          <BankForm
            values={{
              accountName: bankAccountName,
              bsb: bankBsb,
              accountNumber: bankAccountNumber,
              amount: bankAmount,
              desc: bankDesc,
              uniqueRef: bankUniqueRef,
              lodgementRef: bankLodgementRef,
              remitter: bankRemitter,
            }}
            onChange={{
              setAccountName: setBankAccountName,
              setBsb: setBankBsb,
              setAccountNumber: setBankAccountNumber,
              setAmount: setBankAmount,
              setDesc: setBankDesc,
              setUniqueRef: setBankUniqueRef,
              setLodgementRef: setBankLodgementRef,
              setRemitter: setBankRemitter,
            }}
            OptionalSection={OptionalSection}
            showOptional={showOptional}
          />
        )}

        {toType === "bpay" && (
          <BpayForm
            values={{
              billerCode: bpayCode,
              reference: bpayRef,
              amount: bpayAmount,
              desc: bpayDesc,
              uniqueRef: bpayUniqueRef,
              lodgementRef: bpayLodgementRef,
              remitter: bpayRemitter,
            }}
            onChange={{
              setBillerCode: setBpayCode,
              setReference: setBpayRef,
              setAmount: setBpayAmount,
              setDesc: setBpayDesc,
              setUniqueRef: setBpayUniqueRef,
              setLodgementRef: setBpayLodgementRef,
              setRemitter: setBpayRemitter,
            }}
            OptionalSection={OptionalSection}
            showOptional={showOptional}
          />
        )}

        {toType === "monoova" && (
          <MaccForm
            values={{
              accountId: maccId,
              amount: maccAmount,
              desc: maccDesc,
              uniqueRef: maccUniqueRef,
              lodgementRef: maccLodgementRef,
              remitter: maccRemitter,
            }}
            onChange={{
              setAccountId: setMaccId,
              setAmount: setMaccAmount,
              setDesc: setMaccDesc,
              setUniqueRef: setMaccUniqueRef,
              setLodgementRef: setMaccLodgementRef,
              setRemitter: setMaccRemitter,
            }}
            OptionalSection={OptionalSection}
            showOptional={showOptional}
          />
        )}

        {/* ACTIONS (always visible like your shots) */}
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/payments/review"
            className="inline-flex items-center justify-center bg-panel border border-outline/40 rounded-lg h-9 px-4 text-sm"
          >
            ← Back
          </Link>
          <button
            className="ml-auto inline-flex items-center justify-center bg-[#6d44c9] rounded-lg h-9 px-5 text-sm"
            // disabled until required fields are filled; keep enabled state wiring for later
            type="button"
          >
            Review →
          </button>
        </div>
      </div>
    </AppShell>
  );
}

/* ---------- Small helpers & sub-forms ---------- */

function DropdownRow({
  icon,
  label,
  onClick,
}: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="w-full text-left px-2 py-2 rounded hover:bg-panel/60 flex items-center gap-2"
      onClick={onClick}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

/** BANK FORM */
function BankForm({
  values,
  onChange,
  OptionalSection,
  showOptional,
}: {
  values: {
    accountName: string;
    bsb: string;
    accountNumber: string;
    amount: string;
    desc: string;
    uniqueRef: string;
    lodgementRef: string;
    remitter: string;
  };
  onChange: {
    setAccountName: (v: string) => void;
    setBsb: (v: string) => void;
    setAccountNumber: (v: string) => void;
    setAmount: (v: string) => void;
    setDesc: (v: string) => void;
    setUniqueRef: (v: string) => void;
    setLodgementRef: (v: string) => void;
    setRemitter: (v: string) => void;
  };
  OptionalSection: JSX.Element;
  showOptional: boolean;
}) {
  return (
    <div className="mt-4 space-y-4">
      <LabeledInput label="Account name" value={values.accountName} onChange={onChange.setAccountName} />
      <LabeledInput label="BSB" value={values.bsb} onChange={onChange.setBsb} />
      <LabeledInput label="Account number" value={values.accountNumber} onChange={onChange.setAccountNumber} />
      <AmountInput label="Amount" value={values.amount} onChange={onChange.setAmount} />
      <LabeledTextArea
        label="Description"
        helper="This is an internal field and will appear in mAccounts statements. Only alphanumeric characters, spaces, commas, periods and dollar signs are allowed"
        value={values.desc}
        onChange={onChange.setDesc}
      />

      {OptionalSection}

      {showOptional && (
        <div className="mt-3 space-y-4">
          <UniqueRefInput value={values.uniqueRef} onChange={onChange.setUniqueRef} />
          <LabeledInput label="Lodgement reference (optional)" value={values.lodgementRef} onChange={onChange.setLodgementRef} />
          <LabeledInput label="Remitter name (optional)" value={values.remitter} onChange={onChange.setRemitter} />
        </div>
      )}
    </div>
  );
}

/** BPAY FORM */
function BpayForm({
  values,
  onChange,
  OptionalSection,
  showOptional,
}: {
  values: {
    billerCode: string;
    reference: string;
    amount: string;
    desc: string;
    uniqueRef: string;
    lodgementRef: string;
    remitter: string;
  };
  onChange: {
    setBillerCode: (v: string) => void;
    setReference: (v: string) => void;
    setAmount: (v: string) => void;
    setDesc: (v: string) => void;
    setUniqueRef: (v: string) => void;
    setLodgementRef: (v: string) => void;
    setRemitter: (v: string) => void;
  };
  OptionalSection: JSX.Element;
  showOptional: boolean;
}) {
  return (
    <div className="mt-4 space-y-4">
      <LabeledInput label="Biller code" value={values.billerCode} onChange={onChange.setBillerCode} />
      <LabeledInput label="Reference number" value={values.reference} onChange={onChange.setReference} />
      <AmountInput label="Amount" value={values.amount} onChange={onChange.setAmount} />
      <LabeledTextArea
        label="Description"
        helper="This is an internal field and will appear in mAccounts statements. Only alphanumeric characters, spaces, commas, periods and dollar signs are allowed"
        value={values.desc}
        onChange={onChange.setDesc}
      />

      {OptionalSection}

      {showOptional && (
        <div className="mt-3 space-y-4">
          <UniqueRefInput value={values.uniqueRef} onChange={onChange.setUniqueRef} />
          <LabeledInput label="Lodgement reference (optional)" value={values.lodgementRef} onChange={onChange.setLodgementRef} />
          <LabeledInput label="Remitter name (optional)" value={values.remitter} onChange={onChange.setRemitter} />
        </div>
      )}
    </div>
  );
}

/** MONOOVA ACCOUNT FORM */
function MaccForm({
  values,
  onChange,
  OptionalSection,
  showOptional,
}: {
  values: {
    accountId: string;
    amount: string;
    desc: string;
    uniqueRef: string;
    lodgementRef: string;
    remitter: string;
  };
  onChange: {
    setAccountId: (v: string) => void;
    setAmount: (v: string) => void;
    setDesc: (v: string) => void;
    setUniqueRef: (v: string) => void;
    setLodgementRef: (v: string) => void;
    setRemitter: (v: string) => void;
  };
  OptionalSection: JSX.Element;
  showOptional: boolean;
}) {
  return (
    <div className="mt-4 space-y-4">
      <LabeledInput label="Monoova account ID" value={values.accountId} onChange={onChange.setAccountId} />
      <AmountInput label="Amount" value={values.amount} onChange={onChange.setAmount} />
      <LabeledTextArea
        label="Description"
        helper="This is an internal field and will appear in mAccounts statements. Only alphanumeric characters, spaces, commas, periods and dollar signs are allowed"
        value={values.desc}
        onChange={onChange.setDesc}
      />

      {OptionalSection}

      {showOptional && (
        <div className="mt-3 space-y-4">
          <UniqueRefInput value={values.uniqueRef} onChange={onChange.setUniqueRef} />
          <LabeledInput label="Lodgement reference (optional)" value={values.lodgementRef} onChange={onChange.setLodgementRef} />
          <LabeledInput label="Remitter name (optional)" value={values.remitter} onChange={onChange.setRemitter} />
        </div>
      )}
    </div>
  );
}

/* ----------- leaf inputs (shared look & feel) ----------- */

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-sm mb-1">{label}</div>
      <input
        className="w-full bg-surface border border-outline/40 rounded-lg h-10 px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function LabeledTextArea({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-sm mb-1">{label}</div>
      {helper && <div className="text-xs text-subt mb-2">{helper}</div>}
      <textarea
        className="w-full bg-surface border border-outline/40 rounded-lg px-3 py-2 text-sm min-h-[84px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function AmountInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-sm mb-1">{label}</div>
      <div className="flex items-center bg-surface border border-outline/40 rounded-lg h-10 px-2">
        <span className="px-2 text-subt">$</span>
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

function UniqueRefInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-sm mb-1">Unique reference</div>
      <div className="text-xs text-subt mb-2">
        This is an internal field used by the system to prevent duplicate payments. This field has to be a unique value in our system
      </div>
      <div className="flex items-center bg-surface border border-outline/40 rounded-lg h-10 px-2">
        <input
          className="flex-1 bg-transparent outline-none text-sm px-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=""
        />
        {/* rotate/refresh icon placeholder (no auto-fill per your note) */}
        <span className="text-subt px-2">⟲</span>
      </div>
    </label>
  );
}

