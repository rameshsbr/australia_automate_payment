// app/(app)/payments/payees/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Popover } from "@/components/ui";
import { FilterChip } from "@/components/payments-common";
import { FooterPagination, EmptyStatePanel } from "@/components/payments-widgets";
import { useAppMode } from "@/components/mode/ModeProvider";

type AccountRow = { mAccount: string; name: string; currency: string };
type TokenRow = { token: string; type?: string; nickname?: string; createdAt?: string };

const PAYEE_TYPES = ["Bank Account", "BPay biller"];

export default function Page() {
  const mode = useAppMode(); // "sandbox" | "live"

  // filters + ui state
  const [type, setType] = useState<string | undefined>(undefined);

  // accounts + selection
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [acct, setAcct] = useState<string>("");

  // tokens
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modals
  const [showCreate, setShowCreate] = useState(false);
  const [showValidate, setShowValidate] = useState<null | TokenRow>(null);
  const [showRename, setShowRename] = useState<null | TokenRow>(null);
  const [showDetails, setShowDetails] = useState<null | { token: string; body?: any }>(null);
  const [confirmDel, setConfirmDel] = useState<null | TokenRow>(null);

  // ---------- loads ----------
  async function loadAccounts() {
    setError(null);
    try {
      const r = await fetch(`/api/monoova/account?env=${mode}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      const rows: AccountRow[] = j.rows ?? [];
      setAccounts(rows);
      // keep selection if possible, else first account
      setAcct(a => (a && rows.some(x => x.mAccount === a)) ? a : (rows[0]?.mAccount ?? ""));
    } catch (e: any) {
      setError(e?.message || String(e));
      setAccounts([]);
      setAcct("");
    }
  }

  async function loadTokens(accountNumber: string) {
    if (!accountNumber) { setTokens([]); return; }
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/monoova/token/accounts-list/${encodeURIComponent(accountNumber)}?env=${mode}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setTokens(j.rows ?? []);
    } catch (e: any) {
      setError(e?.message || String(e));
      setTokens([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void loadAccounts(); }, [mode]);
  useEffect(() => { if (acct) void loadTokens(acct); }, [acct, mode]);

  // ---------- derived ----------
  const locked = /MerchantLockedOut/i.test(error || "");
  const filtered = useMemo(() => {
    if (!type) return tokens;
    // placeholder if you later categorize by type; for now returns same set
    return tokens;
  }, [tokens, type]);

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-semibold flex-1">Payees</h1>

        {/* Account picker */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-subt">mAccount:</label>
          <select
            className="bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm"
            value={acct}
            onChange={(e) => setAcct(e.target.value)}
          >
            {accounts.map(a => (
              <option key={a.mAccount} value={a.mAccount}>
                {a.mAccount} {a.name ? `– ${a.name}` : ""}
              </option>
            ))}
          </select>
          <button
            className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm"
            onClick={() => { void loadAccounts(); if (acct) void loadTokens(acct); }}
            disabled={busy}
          >
            {busy ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filters + actions */}
      <div className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70"
          placeholder="Search payees... (coming soon)"
          disabled
        />

        <Popover
          className="w-[220px]"
          button={({ open }) => (
            <FilterChip>
              <span>Type</span>
              <span className="text-subt">{type ?? ""}</span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
        >
          <div className="text-sm space-y-1">
            {PAYEE_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input type="radio" name="payeeType" checked={type === t} onChange={() => setType(t)} />
                <span>{t}</span>
              </label>
            ))}
            <button className="mt-2 w-full bg-[#6d44c9] rounded h-8 text-sm">Apply</button>
          </div>
        </Popover>

        <div className="ml-auto">
          <button
            className="inline-flex items-center gap-2 bg-[#6d44c9] rounded-lg px-3 h-9 text-sm"
            onClick={() => setShowCreate(true)}
            disabled={!acct}
          >
            + New AU bank payee
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-3 text-sm px-3 py-2 rounded-lg border border-amber-600/50 bg-amber-950/30">
          {locked
            ? "Upstream says your merchant is locked out. Try again after it’s cleared, or contact Monoova support."
            : error}
        </div>
      )}

      {/* Tokens table */}
      <div className="bg-panel rounded-xl2 border border-outline/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-outline/30 text-sm text-subt">
          {acct ? <>Tokens for <span className="font-mono">{acct}</span></> : "Select an account to view tokens"}
        </div>

        {filtered.length === 0 ? (
          <EmptyStatePanel icon="👤" title="No payees" subtitle="Create a new payee to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface/60">
              <tr className="text-subt">
                <th className="text-left p-2">Token</th>
                <th className="text-left p-2">Nickname</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.token} className="border-t border-outline/30">
                  <td className="p-2 font-mono">{t.token}</td>
                  <td className="p-2">{t.nickname || "—"}</td>
                  <td className="p-2">{t.type || "—"}</td>
                  <td className="p-2">{t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}</td>
                  <td className="p-2">
                    <div className="inline-flex items-center gap-3 text-subt">
                      <button className="hover:underline" onClick={() => doDetails(t.token)}>Details</button>
                      <button className="hover:underline" onClick={() => setShowRename(t)}>Rename</button>
                      <button className="hover:underline" onClick={() => setShowValidate(t)}>Validate</button>
                      <button className="hover:underline" onClick={() => setConfirmDel(t)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-2 text-xs text-subt">Showing {filtered.length} of {tokens.length}</div>

      <FooterPagination />

      {/* Modals */}
      {showCreate && (
        <CreateTokenModal
          mode={mode}
          onClose={() => setShowCreate(false)}
          onDone={() => { setShowCreate(false); void loadTokens(acct); }}
          acct={acct}
        />
      )}

      {showValidate && (
        <ValidateModal
          mode={mode}
          token={showValidate.token}
          onClose={() => setShowValidate(null)}
        />
      )}

      {showRename && (
        <RenameModal
          mode={mode}
          row={showRename}
          onClose={() => setShowRename(null)}
          onDone={() => { setShowRename(null); void loadTokens(acct); }}
        />
      )}

      {confirmDel && (
        <DeleteModal
          mode={mode}
          row={confirmDel}
          onClose={() => setConfirmDel(null)}
          onDone={() => { setConfirmDel(null); void loadTokens(acct); }}
        />
      )}

      {showDetails && (
        <DetailsModal
          token={showDetails.token}
          body={showDetails.body}
          onClose={() => setShowDetails(null)}
        />
      )}
    </>
  );

  // ---------- actions ----------
  async function doDetails(token: string) {
    try {
      const r = await fetch(`/api/monoova/token/item/${encodeURIComponent(token)}?env=${mode}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setShowDetails({ token, body: j?.raw ?? j });
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }
}

/* ========================= Modals ========================= */

function CreateTokenModal({
  mode, acct, onClose, onDone,
}: { mode: "sandbox" | "live"; acct: string; onClose: () => void; onDone: () => void; }) {
  const [bsb, setBsb] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const body = { bsb, accountNumber, nickname: nickname || undefined };
      const r = await fetch(`/api/monoova/token/accounts-create-au/${encodeURIComponent(acct)}?env=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      onDone();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="New bank payee" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div className="text-subt">Create a tokenized Australian bank account payee.</div>
        <label className="block">
          <div className="text-subt mb-1">BSB</div>
          <input className="w-full bg-panel border border-outline/40 rounded px-2 py-1" value={bsb} onChange={e=>setBsb(e.target.value)} placeholder="062000" />
        </label>
        <label className="block">
          <div className="text-subt mb-1">Account number</div>
          <input className="w-full bg-panel border border-outline/40 rounded px-2 py-1" value={accountNumber} onChange={e=>setAccountNumber(e.target.value)} placeholder="123456789" />
        </label>
        <label className="block">
          <div className="text-subt mb-1">Nickname (optional)</div>
          <input className="w-full bg-panel border border-outline/40 rounded px-2 py-1" value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Sally Pty Ltd (Main)" />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-2 border border-outline/40 rounded" onClick={onClose}>Cancel</button>
          <button
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
            disabled={busy || !bsb.trim() || !accountNumber.trim()}
            onClick={save}
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ValidateModal({
  mode, token, onClose,
}: { mode: "sandbox" | "live"; token: string; onClose: () => void; }) {
  const [amount, setAmount] = useState("0.01");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setBusy(true);
    try {
      const body = { token, amount };
      const r = await fetch(`/api/monoova/token/validate?env=${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setResult(j);
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Validate token – ${token}`} onClose={onClose}>
      <div className="space-y-3 text-sm">
        <label className="block">
          <div className="text-subt mb-1">Amount</div>
          <input className="w-full bg-panel border border-outline/40 rounded px-2 py-1" value={amount} onChange={e=>setAmount(e.target.value)} />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-2 border border-outline/40 rounded" onClick={onClose}>Close</button>
          <button className="px-3 py-2 rounded bg-black text-white disabled:opacity-60" disabled={busy} onClick={run}>
            {busy ? "Validating…" : "Validate"}
          </button>
        </div>
        {result && (
          <pre className="mt-3 p-2 rounded bg-panel border border-outline/40 text-xs overflow-auto max-h-64">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </Modal>
  );
}

function RenameModal({
  mode, row, onClose, onDone,
}: { mode: "sandbox" | "live"; row: TokenRow; onClose: () => void; onDone: () => void; }) {
  const [nickname, setNickname] = useState(row.nickname ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/monoova/token/item/${encodeURIComponent(row.token)}?env=${mode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      const j = await r.json().catch(()=> ({}));
      if (!r.ok) throw new Error(j?.error || r.statusText);
      onDone();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Rename ${row.token}`} onClose={onClose}>
      <div className="space-y-3 text-sm">
        <label className="block">
          <div className="text-subt mb-1">Nickname</div>
          <input className="w-full bg-panel border border-outline/40 rounded px-2 py-1" value={nickname} onChange={e=>setNickname(e.target.value)} />
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

function DeleteModal({
  mode, row, onClose, onDone,
}: { mode: "sandbox" | "live"; row: TokenRow; onClose: () => void; onDone: () => void; }) {
  const [busy, setBusy] = useState(false);

  const del = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/monoova/token/item/${encodeURIComponent(row.token)}?env=${mode}`, { method: "DELETE" });
      const j = await r.json().catch(()=> ({}));
      if (!r.ok) throw new Error(j?.error || r.statusText);
      onDone();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Delete token" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div>Are you sure you want to delete token <span className="font-mono">{row.token}</span>?</div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-2 border border-outline/40 rounded" onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded bg-[#b91c1c] text-white disabled:opacity-60" disabled={busy} onClick={del}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DetailsModal({
  token, body, onClose,
}: { token: string; body?: any; onClose: () => void; }) {
  return (
    <Modal title={`Details – ${token}`} onClose={onClose}>
      <pre className="text-xs p-2 rounded bg-panel border border-outline/40 overflow-auto max-h-[60vh]">
        {JSON.stringify(body ?? {}, null, 2)}
      </pre>
      <div className="mt-3 text-right">
        <button className="px-3 py-2 border border-outline/40 rounded" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface border border-outline/40 rounded-xl w-[min(680px,92vw)] shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline/30">
          <div className="font-medium text-sm">{title}</div>
          <button className="text-subt hover:text-white text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}