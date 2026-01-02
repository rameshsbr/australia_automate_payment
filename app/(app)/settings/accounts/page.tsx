// app/(app)/settings/accounts/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppMode } from "@/components/mode/ModeProvider";

type Row = { mAccount: string; name: string; currency: string };
type TokenRow = { token: string; type?: string; nickname?: string; createdAt?: string | null; raw?: any };

export default function AccountsPage() {
  const mode = useAppMode(); // "sandbox" | "live"
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modals
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<null | Row>(null);
  const [closing, setClosing] = useState<null | Row>(null);
  const [stmtRow, setStmtRow] = useState<null | Row>(null);
  const [tokensRow, setTokensRow] = useState<null | Row>(null);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/monoova/account?env=${mode}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setRows(j.rows ?? []);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void load(); }, [mode]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const t = q.toLowerCase();
    return rows.filter(r =>
      r.mAccount.toLowerCase().includes(t) ||
      (r.name || "").toLowerCase().includes(t) ||
      (r.currency || "").toLowerCase().includes(t)
    );
  }, [q, rows]);

  return (
    <>
      <div className="text-subt text-sm mb-3">
        <Link href="/settings" className="hover:underline">← Settings</Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-semibold flex-1">Accounts</h1>
        <button
          className="bg-[#6d44c9] hover:bg-[#5a36a6] rounded-lg px-3 h-9 text-sm font-semibold"
          onClick={() => setCreating(true)}
        >
          + New mAccount
        </button>
      </div>

      <div className="bg-panel rounded-xl2 border border-outline/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-outline/30 flex items-center gap-2">
          <input
            className="flex-1 h-9 bg-surface border border-outline/40 rounded-lg px-3 text-sm placeholder:text-subt/70"
            placeholder="Search accounts by mAccount or name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={() => load()}
            className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm"
            disabled={busy}
          >
            {busy ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error ? (
          <div className="px-6 py-3 text-amber-300 text-sm">{error}</div>
        ) : null}

        <table className="w-full text-sm">
          <thead className="bg-surface/60">
            <tr className="text-subt">
              <th className="text-left p-2">mAccount</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Currency</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td className="p-6 text-center text-subt" colSpan={4}>No accounts found</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.mAccount} className="border-t border-outline/30">
                <td className="p-2 font-mono">{r.mAccount}</td>
                <td className="p-2">{r.name || "—"}</td>
                <td className="p-2">{r.currency || "AUD"}</td>
                <td className="p-2">
                  <div className="inline-flex items-center gap-3 text-subt">
                    <button className="hover:underline" onClick={() => setEditing(r)}>Update</button>
                    <button className="hover:underline" onClick={() => setStmtRow(r)}>Send statement</button>
                    <button className="hover:underline" onClick={() => setClosing(r)}>Close</button>
                    <button className="hover:underline" onClick={() => setTokensRow(r)}>Tokens</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-xs text-subt">Showing {filtered.length} of {rows.length}</div>

      {/* Create modal */}
      {creating && <CreateModal mode={mode} onClose={() => setCreating(false)} onDone={load} />}

      {/* Update modal */}
      {editing && <UpdateModal mode={mode} row={editing} onClose={() => setEditing(null)} onDone={load} />}

      {/* Close modal */}
      {closing && <CloseModal mode={mode} row={closing} onClose={() => setClosing(null)} onDone={load} />}

      {/* Statement modal */}
      {stmtRow && <StatementModal mode={mode} row={stmtRow} onClose={() => setStmtRow(null)} />}

      {/* Tokens modal */}
      {tokensRow && <TokensModal mode={mode} row={tokensRow} onClose={() => setTokensRow(null)} />}
    </>
  );
}

function CreateModal({ mode, onClose, onDone }: { mode: "sandbox" | "live"; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("AUD");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/monoova/account?env=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currency }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      onClose(); onDone();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Create mAccount" onClose={onClose}>
      <div className="space-y-3">
        <label className="block text-sm">
          <div className="text-subt mb-1">Name</div>
          <input className="w-full bg-panel border border-outline/40 rounded px-2 py-1" value={name} onChange={e=>setName(e.target.value)} />
        </label>
        <label className="block text-sm">
          <div className="text-subt mb-1">Currency</div>
          <select className="w-full bg-panel border border-outline/40 rounded px-2 py-1" value={currency} onChange={e=>setCurrency(e.target.value)}>
            <option value="AUD">AUD</option>
          </select>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-2 border border-outline/40 rounded" onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded bg-black text-white disabled:opacity-60" disabled={busy || !name.trim()} onClick={save}>
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function UpdateModal({ mode, row, onClose, onDone }: { mode: "sandbox" | "live"; row: { mAccount: string; name: string; currency: string }; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(row.name ?? "");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/monoova/account/${encodeURIComponent(row.mAccount)}?env=${mode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      onClose(); onDone();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={`Update ${row.mAccount}`} onClose={onClose}>
      <div className="space-y-3">
        <label className="block text-sm">
          <div className="text-subt mb-1">Name</div>
          <input className="w-full bg-panel border border-outline/40 rounded px-2 py-1" value={name} onChange={e=>setName(e.target.value)} />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-2 border border-outline/40 rounded" onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded bg-black text-white disabled:opacity-60" disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CloseModal({ mode, row, onClose, onDone }: { mode: "sandbox" | "live"; row: { mAccount: string; name: string }; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const closeIt = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/monoova/account/${encodeURIComponent(row.mAccount)}?env=${mode}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || r.statusText);
      onClose(); onDone();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Close mAccount" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div>Are you sure you want to close <span className="font-mono">{row.mAccount}</span> ({row.name || "unnamed"})?</div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-2 border border-outline/40 rounded" onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded bg-[#b91c1c] text-white disabled:opacity-60" disabled={busy} onClick={closeIt}>
            {busy ? "Closing…" : "Close account"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function StatementModal({ mode, row, onClose }: { mode: "sandbox" | "live"; row: { mAccount: string; name: string }; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/monoova/account/${encodeURIComponent(row.mAccount)}/statement?env=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: email, fromDate, toDate, format: "pdf" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      alert("Statement request sent.");
      onClose();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Send statement – ${row.mAccount}`} onClose={onClose}>
      <div className="space-y-3 text-sm">
        <label className="block">
          <div className="text-subt mb-1">Email</div>
          <input className="w-full bg-panel border border-outline/40 rounded px-2 py-1" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@example.com" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <div className="text-subt mb-1">From (YYYY-MM-DD)</div>
            <input className="w-full bg-panel border border-outline/40 rounded px-2 py-1" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} placeholder="2025-01-01" />
          </label>
          <label className="block">
            <div className="text-subt mb-1">To (YYYY-MM-DD)</div>
            <input className="w-full bg-panel border border-outline/40 rounded px-2 py-1" value={toDate} onChange={(e)=>setToDate(e.target.value)} placeholder="2025-01-31" />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-2 border border-outline/40 rounded" onClick={onClose}>Cancel</button>
          <button
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
            disabled={busy || !email || !fromDate || !toDate}
            onClick={send}
          >
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TokensModal({ mode, row, onClose }: { mode: "sandbox" | "live"; row: { mAccount: string; name: string }; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [detailToken, setDetailToken] = useState<string | null>(null);
  const [detailOut, setDetailOut] = useState<any | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  const [editToken, setEditToken] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  const [deleteBusy, setDeleteBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null); setTokens([]);
    try {
      const r = await fetch(`/api/monoova/token/${encodeURIComponent(row.mAccount)}/list?env=${mode}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      const items: TokenRow[] = Array.isArray(j) ? j : (j?.rows ?? j?.tokens ?? []);
      setTokens(items);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function getDetails(t: string) {
    setDetailBusy(true); setDetailOut(null); setDetailToken(t);
    try {
      const r = await fetch(`/api/monoova/token/${encodeURIComponent(t)}?env=${mode}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setDetailOut(j);
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setDetailBusy(false);
    }
  }

  async function saveNickname() {
    if (!editToken) return;
    setEditBusy(true);
    try {
      const r = await fetch(`/api/monoova/token/${encodeURIComponent(editToken)}?env=${mode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setEditToken(null); setNickname("");
      await load();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setEditBusy(false);
    }
  }

  async function deleteToken(t: string) {
    if (!confirm(`Delete token ${t}?`)) return;
    setDeleteBusy(t);
    try {
      const r = await fetch(`/api/monoova/token/${encodeURIComponent(t)}?env=${mode}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      await load();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setDeleteBusy(null);
    }
  }

  // initial load
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <Modal title={`Tokens – ${row.mAccount}`} onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <button className="px-3 h-8 rounded bg-surface border border-outline/40" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
          {err && <div className="text-amber-300">{err}</div>}
        </div>

        <div className="border border-outline/30 rounded">
          <table className="w-full text-sm">
            <thead className="bg-surface/60">
              <tr className="text-subt">
                <th className="text-left p-2">Token</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Nickname</th>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tokens.length === 0 ? (
                <tr><td className="p-4 text-subt text-center" colSpan={5}>{loading ? "Loading…" : "No tokens"}</td></tr>
              ) : tokens.map((t) => (
                <tr key={t.token} className="border-t border-outline/30">
                  <td className="p-2 font-mono">{t.token}</td>
                  <td className="p-2">{t.type || "—"}</td>
                  <td className="p-2">{t.nickname || "—"}</td>
                  <td className="p-2">{t.createdAt || "—"}</td>
                  <td className="p-2">
                    <div className="inline-flex items-center gap-3 text-subt">
                      <button className="hover:underline" onClick={() => getDetails(t.token)}>
                        {detailBusy && detailToken === t.token ? "Loading…" : "Details"}
                      </button>
                      <button className="hover:underline" onClick={() => { setEditToken(t.token); setNickname(t.nickname || ""); }}>
                        Update
                      </button>
                      <button className="hover:underline" onClick={() => deleteToken(t.token)} disabled={deleteBusy === t.token}>
                        {deleteBusy === t.token ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inline editor */}
        {editToken && (
          <div className="p-3 bg-surface border border-outline/30 rounded">
            <div className="text-subt mb-2">Update nickname for <span className="font-mono">{editToken}</span></div>
            <div className="flex items-center gap-2">
              <input className="flex-1 bg-panel border border-outline/40 rounded px-2 py-1"
                     value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Nickname" />
              <button className="px-3 h-8 rounded bg-black text-white disabled:opacity-60" disabled={editBusy} onClick={saveNickname}>
                {editBusy ? "Saving…" : "Save"}
              </button>
              <button className="px-3 h-8 rounded border border-outline/40" onClick={() => { setEditToken(null); setNickname(""); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Details viewer */}
        {detailOut && (
          <div className="p-3 bg-surface border border-outline/30 rounded">
            <div className="flex items-center justify-between">
              <div className="text-subt">Token details – <span className="font-mono">{detailToken}</span></div>
              <button className="text-xs text-subt hover:text-white" onClick={() => { setDetailOut(null); setDetailToken(null); }}>Close</button>
            </div>
            <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(detailOut, null, 2)}</pre>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface border border-outline/40 rounded-xl w-[min(820px,92vw)] shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline/30">
          <div className="font-medium text-sm">{title}</div>
          <button className="text-subt hover:text-white text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}