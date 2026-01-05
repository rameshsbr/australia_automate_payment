// app/(app)/payid/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppMode } from "@/components/mode/ModeProvider";

type Env = "sandbox" | "live";

type AutomatcherAcct = {
  id?: string;
  name?: string;
  label?: string;
  bsb?: string;
  bankAccountNumber?: string;
};

function pretty(o: any) {
  try { return JSON.stringify(o, null, 2); } catch { return String(o); }
}

export default function PayIdPage() {
  const mode = useAppMode();
  const env = (mode as Env) || "sandbox";

  // ---- Enquiry
  const [payIdLookup, setPayIdLookup] = useState("");
  const [lookupRes, setLookupRes] = useState<any>(null);
  const [lookupBusy, setLookupBusy] = useState(false);

  // ---- Register
  const [regPayId, setRegPayId] = useState("");
  const [payIdName, setPayIdName] = useState("");

  const [acctOptions, setAcctOptions] = useState<AutomatcherAcct[]>([]);
  const [acctPick, setAcctPick] = useState<string>(""); // `${bsb}|${bankAccountNumber}`
  const [bsb, setBsb] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [registerBusy, setRegisterBusy] = useState(false);
  const [registerRes, setRegisterRes] = useState<any>(null);

  // ---- List / delete
  const [listBusy, setListBusy] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Automatcher accounts (best-effort)
  async function loadAutomatcherAccounts() {
    try {
      const r = await fetch(`/api/monoova/account?env=${env}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      const arr: any[] = Array.isArray(j?.rows) ? j.rows : (j?.data || j || []);
      const opts: AutomatcherAcct[] = arr
        .map((x) => {
          const item: AutomatcherAcct = {
            id: x.id || x.mAccount || x.accountId,
            name: x.accountName || x.name,
            bsb: x.bsb || x.BSB,
            bankAccountNumber: x.bankAccountNumber || x.accountNumber,
          };
          item.label = item.name && (item.bsb || item.bankAccountNumber)
            ? `${item.name} – ${item.bsb || "??"}-${item.bankAccountNumber || "??"}`
            : item.name || item.id || "(account)";
          return item;
        })
        .filter((x) => x.bsb && x.bankAccountNumber);
      setAcctOptions(opts);
    } catch { setAcctOptions([]); }
  }

  async function loadList() {
    setListBusy(true); setError(null);
    try {
      const r = await fetch(`/api/monoova/payid/list?env=${env}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setRows(Array.isArray(j?.rows) ? j.rows : []);
    } catch (e: any) {
      setError(e?.message || String(e));
      setRows([]);
    } finally {
      setListBusy(false);
    }
  }

  useEffect(() => {
    loadAutomatcherAccounts();
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env]);

  useEffect(() => {
    if (!acctPick) return;
    const [b, a] = acctPick.split("|");
    setBsb(b || "");
    setBankAccountNumber(a || "");
  }, [acctPick]);

  // Actions
  async function doLookup() {
    setLookupBusy(true); setLookupRes(null);
    try {
      const r = await fetch(`/api/monoova/payid/resolve?env=${env}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payId: payIdLookup }),
      });
      const j = await r.json();
      setLookupRes(j);
    } catch (e: any) {
      setLookupRes({ error: e?.message || String(e) });
    } finally {
      setLookupBusy(false);
    }
  }

  async function doRegister() {
    setRegisterBusy(true); setRegisterRes(null);
    try {
      const r = await fetch(`/api/monoova/payid/register?env=${env}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          payId: regPayId,
          payIdName: payIdName,
          bsb: bsb || undefined,
          bankAccountNumber,
        }),
      });
      const j = await r.json();
      setRegisterRes(j);
      await loadList();
    } catch (e: any) {
      setRegisterRes({ error: e?.message || String(e) });
    } finally {
      setRegisterBusy(false);
    }
  }

  async function remove(payId: string) {
    if (!confirm("Disable this PayID?")) return;
    try {
      const r = await fetch(`/api/monoova/payid/${encodeURIComponent(payId)}/delete?env=${env}`, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) alert(j?.error || r.statusText);
      await loadList();
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  const automatcherHint = "Tip: Pick an Automatcher account to auto-fill BSB + bank account number.";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">PayID</h1>

      {/* Enquiry */}
      <div className="bg-panel border border-outline/40 rounded-xl2 p-4 space-y-3">
        <div className="font-medium">Lookup</div>
        <div className="grid grid-cols-3 gap-3 items-center">
          <div className="col-span-3 sm:col-span-1 text-xs text-subt">Email address</div>
          <input
            className="bg-surface border border-outline/40 rounded px-2 py-1 text-sm col-span-3 sm:col-span-2"
            placeholder="name@example.com"
            value={payIdLookup}
            onChange={(e) => setPayIdLookup(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button
            className="px-3 h-9 rounded-lg bg-black text-white text-sm disabled:opacity-60"
            disabled={lookupBusy}
            onClick={doLookup}
          >
            {lookupBusy ? "Looking up…" : "Lookup"}
          </button>
        </div>
        <pre className="text-xs bg-surface border border-outline/30 rounded p-3 min-h-[56px] overflow-auto">
{lookupRes ? pretty(lookupRes) : "No result yet."}
        </pre>
      </div>

      {/* Register */}
      <div className="bg-panel border border-outline/40 rounded-xl2 p-4 space-y-3">
        <div className="font-medium">Register (link)</div>
        <div className="text-xs text-subt">{automatcherHint}{" "}
          <Link href={env === "sandbox" ? "/sandbox/automatchers" : "/automatchers"} className="underline">
            Create or update Automatchers
          </Link>.
        </div>

        {/* Automatcher picker */}
        <div className="grid grid-cols-2 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs text-subt">Automatcher account</label>
            <select
              className="w-full bg-surface border border-outline/40 rounded px-2 py-1 text-sm"
              value={acctPick}
              onChange={(e) => setAcctPick(e.target.value)}
            >
              <option value="">— Select (or fill manually below) —</option>
              {acctOptions.map((a, idx) => (
                <option
                  key={`${a.bsb}|${a.bankAccountNumber}|${idx}`}
                  value={`${a.bsb}|${a.bankAccountNumber}`}
                >
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-subt">PayID (email)</label>
            <input
              className="border border-outline/40 rounded px-2 py-1 w-full bg-surface text-sm"
              value={regPayId}
              onChange={(e) => setRegPayId(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-subt">PayID name (display name)</label>
            <input
              className="border border-outline/40 rounded px-2 py-1 w-full bg-surface text-sm"
              value={payIdName}
              onChange={(e) => setPayIdName(e.target.value)}
              placeholder="John Citizen"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-subt">BSB (optional)</label>
            <input
              className="border border-outline/40 rounded px-2 py-1 w-full bg-surface text-sm"
              value={bsb}
              onChange={(e) => setBsb(e.target.value)}
              placeholder="802-985"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-subt">Bank account number</label>
            <input
              className="border border-outline/40 rounded px-2 py-1 w-full bg-surface text-sm"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="916782309"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="px-3 h-9 rounded-lg bg-black text-white text-sm disabled:opacity-60"
            disabled={registerBusy}
            onClick={doRegister}
          >
            {registerBusy ? "Registering…" : "Register"}
          </button>
        </div>
        <pre className="text-xs bg-surface border border-outline/30 rounded p-3 min-h-[56px] overflow-auto">
{registerRes ? pretty(registerRes) : "No result yet."}
        </pre>
      </div>

      {/* List / Delete */}
      <div className="bg-panel border border-outline/40 rounded-xl2 p-4 space-y-3">
        <div className="font-medium">My PayIDs</div>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <div className="border border-outline/30 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface/60">
              <tr className="text-subt">
                <th className="text-left p-2">PayID</th>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Account</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listBusy ? (
                <tr><td className="p-3" colSpan={5}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="p-3" colSpan={5}>No PayIDs</td></tr>
              ) : rows.map((r: any, i: number) => {
                const payId = r.payId || r.alias || `row-${i}`;
                const acct = r.bsb && r.bankAccountNumber ? `${r.bsb}-${r.bankAccountNumber}` : r.bankAccountNumber || "-";
                return (
                  <tr key={payId} className="border-t border-outline/30">
                    <td className="p-2">{payId}</td>
                    <td className="p-2">{r.payIdName || "-"}</td>
                    <td className="p-2">{acct}</td>
                    <td className="p-2">{r.status || "-"}</td>
                    <td className="p-2">
                      <button className="px-2 py-1 border border-outline/40 rounded" onClick={() => remove(payId)}>
                        Disable
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}