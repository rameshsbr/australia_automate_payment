"use client";

import { useState } from "react";
import { useAppMode } from "@/components/mode/ModeProvider";

type Jsonish = any;

export default function ApiKeys() {
  const mode = useAppMode(); // "sandbox" | "live"

  // One-shot security token
  const [secBusy, setSecBusy] = useState(false);
  const [secOut, setSecOut] = useState<Jsonish | null>(null);
  const [secErr, setSecErr] = useState<string | null>(null);

  // Create bank-account token
  const [bsb, setBsb] = useState("");
  const [acct, setAcct] = useState("");
  const [acctName, setAcctName] = useState("");
  const [nickname, setNickname] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createOut, setCreateOut] = useState<Jsonish | null>(null);
  const [createErr, setCreateErr] = useState<string | null>(null);

  // Validate token
  const [valToken, setValToken] = useState("");
  const [valAmount, setValAmount] = useState("");
  const [valBusy, setValBusy] = useState(false);
  const [valOut, setValOut] = useState<Jsonish | null>(null);
  const [valErr, setValErr] = useState<string | null>(null);

  async function getSecurityToken() {
    setSecBusy(true); setSecErr(null); setSecOut(null);
    try {
      const r = await fetch(`/api/monoova/security/oneshot?env=${mode}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setSecOut(j);
    } catch (e: any) {
      setSecErr(e?.message || String(e));
    } finally {
      setSecBusy(false);
    }
  }

  async function createBankToken() {
    setCreateBusy(true); setCreateErr(null); setCreateOut(null);
    try {
      const body: any = { bsb, accountNumber: acct };
      if (acctName.trim()) body.accountName = acctName;
      if (nickname.trim()) body.nickname = nickname;

      const r = await fetch(`/api/monoova/token/create-au?env=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setCreateOut(j);
    } catch (e: any) {
      setCreateErr(e?.message || String(e));
    } finally {
      setCreateBusy(false);
    }
  }

  async function validateToken() {
    setValBusy(true); setValErr(null); setValOut(null);
    try {
      const r = await fetch(`/api/monoova/token/validate?env=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: valToken, amount: valAmount }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setValOut(j);
    } catch (e: any) {
      setValErr(e?.message || String(e));
    } finally {
      setValBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Existing sections (unchanged) */}
      <section className="bg-panel border border-outline/40 rounded-xl2">
        <div className="p-4 border-b border-outline/40 text-sm font-medium">API gateway</div>
        <div className="p-4 grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-surface border border-outline/40 rounded-lg p-3 flex items-center justify-between">
            <div>API gateway access</div>
            <div className="opacity-70">Enabled</div>
          </div>
          <div className="bg-surface border border-outline/40 rounded-lg p-3 flex items-center justify-between">
            <div>API gateway key</div>
            <div className="opacity-70">••••••••••••••••</div>
          </div>
        </div>
      </section>

      <section className="bg-panel border border-outline/40 rounded-xl2">
        <div className="p-4 border-b border-outline/40 text-sm font-medium">API credentials</div>
        <div className="p-4">
          <div className="bg-surface border border-outline/40 rounded-lg p-3 flex items-center justify-between">
            <div>Account API key</div>
            <div className="opacity-70">••••••••••••••••••••••••••••••••</div>
          </div>
          <div className="mt-3 text-right">
            <button className="inline-flex items-center bg-[#b53b3b] rounded-lg px-3 h-9 text-sm opacity-90 hover:opacity-100">
              ↻ Roll API key
            </button>
          </div>
        </div>
      </section>

      {/* NEW: Security & Tokens */}
      <section className="bg-panel border border-outline/40 rounded-xl2">
        <div className="p-4 border-b border-outline/40 text-sm font-medium">Security & Tokens</div>

        {/* One-shot security token */}
        <div className="p-4 border-b border-outline/30">
          <div className="text-sm font-medium mb-2">One-shot security token</div>
          <button
            onClick={getSecurityToken}
            disabled={secBusy}
            className="px-3 h-9 rounded-lg bg-[#6d44c9] hover:bg-[#5a36a6] text-sm font-semibold disabled:opacity-60"
          >
            {secBusy ? "Requesting…" : "Create security token"}
          </button>
          {secErr && <div className="mt-2 text-amber-300 text-xs">{secErr}</div>}
          {secOut && (
            <pre className="mt-2 text-xs bg-surface border border-outline/40 rounded-lg p-3 overflow-auto">
              {JSON.stringify(secOut, null, 2)}
            </pre>
          )}
        </div>

        {/* Create bank-account token */}
        <div className="p-4 border-b border-outline/30">
          <div className="text-sm font-medium mb-2">Create token – Australian bank account</div>
          <div className="grid md:grid-cols-4 gap-2 text-sm">
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="BSB (e.g. 062000)" value={bsb} onChange={e=>setBsb(e.target.value)} />
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Account number" value={acct} onChange={e=>setAcct(e.target.value)} />
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Account name (optional)" value={acctName} onChange={e=>setAcctName(e.target.value)} />
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Nickname (optional)" value={nickname} onChange={e=>setNickname(e.target.value)} />
          </div>
          <div className="mt-2">
            <button
              onClick={createBankToken}
              disabled={createBusy || !bsb || !acct}
              className="px-3 h-9 rounded-lg bg-black text-white text-sm disabled:opacity-60"
            >
              {createBusy ? "Creating…" : "Create token"}
            </button>
          </div>
          {createErr && <div className="mt-2 text-amber-300 text-xs">{createErr}</div>}
          {createOut && (
            <pre className="mt-2 text-xs bg-surface border border-outline/40 rounded-lg p-3 overflow-auto">
              {JSON.stringify(createOut, null, 2)}
            </pre>
          )}
        </div>

        {/* Validate token */}
        <div className="p-4">
          <div className="text-sm font-medium mb-2">Validate token</div>
          <div className="grid md:grid-cols-3 gap-2 text-sm">
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Token" value={valToken} onChange={e=>setValToken(e.target.value)} />
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Amount (e.g. 10.00)" value={valAmount} onChange={e=>setValAmount(e.target.value)} />
            <button
              onClick={validateToken}
              disabled={valBusy || !valToken}
              className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm disabled:opacity-60"
            >
              {valBusy ? "Validating…" : "Validate"}
            </button>
          </div>
          {valErr && <div className="mt-2 text-amber-300 text-xs">{valErr}</div>}
          {valOut && (
            <pre className="mt-2 text-xs bg-surface border border-outline/40 rounded-lg p-3 overflow-auto">
              {JSON.stringify(valOut, null, 2)}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}