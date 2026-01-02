// app/(app)/developer/api-keys/page.tsx
"use client";

import { useState } from "react";
import { useAppMode } from "@/components/mode/ModeProvider";

type Jsonish = any;

/* ===== helpers (minimal edits) ===== */
function wrapPem(base64: string, header: string) {
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${header}-----\n${lines.join("\n")}\n-----END ${header}-----\n`;
}
function uint8ToBase64(u8: Uint8Array) {
  return btoa(String.fromCharCode(...u8));
}
function base64ToUint8(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function downloadBlob(filename: string, data: BlobPart, mime = "application/octet-stream") {
  if (data == null) return;
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
async function copyToClipboard(text: string) {
  try { await navigator.clipboard.writeText(text); } catch {}
}

export default function ApiKeys() {
  const mode = useAppMode(); // "sandbox" | "live"

  // ===== One-shot security token =====
  const [secBusy, setSecBusy] = useState(false);
  const [secOut, setSecOut] = useState<Jsonish | null>(null);
  const [secErr, setSecErr] = useState<string | null>(null);

  async function getSecurityToken() {
    setSecBusy(true); setSecErr(null); setSecOut(null);
    try {
      const r = await fetch(`/api/monoova/security/oneshot?env=${mode}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setSecOut(j);
    } catch (e: any) { setSecErr(e?.message || String(e)); }
    finally { setSecBusy(false); }
  }

  // ===== Sign-in settings =====
  const [signBusy, setSignBusy] = useState(false);
  const [signOut, setSignOut] = useState<Jsonish | null>(null);
  const [signErr, setSignErr] = useState<string | null>(null);

  async function getSignInSettings() {
    setSignBusy(true); setSignErr(null); setSignOut(null);
    try {
      const r = await fetch(`/api/monoova/security/signin-settings?env=${mode}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setSignOut(j);
    } catch (e: any) { setSignErr(e?.message || String(e)); }
    finally { setSignBusy(false); }
  }

  // ===== Change password =====
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwOut, setPwOut] = useState<Jsonish | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  async function changePassword() {
    if (newPw !== confirmPw) { setPwErr("Passwords do not match"); return; }
    setPwBusy(true); setPwErr(null); setPwOut(null);
    try {
      const r = await fetch(`/api/monoova/security/change-password?env=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setPwOut(j);
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch (e: any) { setPwErr(e?.message || String(e)); }
    finally { setPwBusy(false); }
  }

  // ===== Create bank-account token (requires mAccount) =====
  const [mAccount, setMAccount] = useState("");
  const [bsb, setBsb] = useState("");
  const [acct, setAcct] = useState("");
  const [acctName, setAcctName] = useState("");
  const [nickname, setNickname] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createOut, setCreateOut] = useState<Jsonish | null>(null);
  const [createErr, setCreateErr] = useState<string | null>(null);

  async function createBankToken() {
    setCreateBusy(true); setCreateErr(null); setCreateOut(null);
    try {
      if (!mAccount.trim()) throw new Error("mAccount is required");
      if (!/^\d{6}$/.test(bsb)) throw new Error("BSB must be 6 digits");
      if (!/^\d{5,20}$/.test(acct)) throw new Error("Account number must be 5–20 digits");
      const body: any = { bsb, accountNumber: acct };
      if (acctName.trim()) body.accountName = acctName;
      if (nickname.trim()) body.nickname = nickname;

      const r = await fetch(`/api/monoova/token/accounts-create-au/${encodeURIComponent(mAccount)}?env=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setCreateOut(j);
    } catch (e: any) { setCreateErr(e?.message || String(e)); }
    finally { setCreateBusy(false); }
  }

  // ===== Validate token =====
  const [valToken, setValToken] = useState("");
  const [valAmount, setValAmount] = useState("");
  const [valBusy, setValBusy] = useState(false);
  const [valOut, setValOut] = useState<Jsonish | null>(null);
  const [valErr, setValErr] = useState<string | null>(null);

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
    } catch (e: any) { setValErr(e?.message || String(e)); }
    finally { setValBusy(false); }
  }

  // ===== List / Get / Update / Delete tokens =====
  // List
  const [listBusy, setListBusy] = useState(false);
  const [listOut, setListOut] = useState<{ rows?: any[] } | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);

  async function listTokens() {
    setListBusy(true); setListErr(null); setListOut(null);
    try {
      if (!mAccount.trim()) throw new Error("mAccount is required");
      const r = await fetch(`/api/monoova/token/accounts-list/${encodeURIComponent(mAccount)}?env=${mode}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setListOut(j);
    } catch (e: any) { setListErr(e?.message || String(e)); }
    finally { setListBusy(false); }
  }

  // Get details
  const [getToken, setGetToken] = useState("");
  const [getBusy, setGetBusy] = useState(false);
  const [getOut, setGetOut] = useState<Jsonish | null>(null);
  const [getErr, setGetErr] = useState<string | null>(null);

  async function getTokenDetails() {
    setGetBusy(true); setGetErr(null); setGetOut(null);
    try {
      if (!getToken.trim()) throw new Error("Token is required");
      const r = await fetch(`/api/monoova/token/item/${encodeURIComponent(getToken)}?env=${mode}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setGetOut(j);
    } catch (e: any) { setGetErr(e?.message || String(e)); }
    finally { setGetBusy(false); }
  }

  // Update nickname
  const [updToken, setUpdToken] = useState("");
  const [updNickname, setUpdNickname] = useState("");
  const [updBusy, setUpdBusy] = useState(false);
  const [updOut, setUpdOut] = useState<Jsonish | null>(null);
  const [updErr, setUpdErr] = useState<string | null>(null);

  async function updateTokenNickname() {
    setUpdBusy(true); setUpdErr(null); setUpdOut(null);
    try {
      if (!updToken.trim()) throw new Error("Token is required");
      const r = await fetch(`/api/monoova/token/item/${encodeURIComponent(updToken)}?env=${mode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: updNickname }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setUpdOut(j);
    } catch (e: any) { setUpdErr(e?.message || String(e)); }
    finally { setUpdBusy(false); }
  }

  // Delete
  const [delToken, setDelToken] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delOut, setDelOut] = useState<Jsonish | null>(null);
  const [delErr, setDelErr] = useState<string | null>(null);

  async function deleteToken() {
    if (!delToken.trim()) { setDelErr("Token is required"); return; }
    if (!confirm(`Delete token ${delToken}?`)) return;
    setDelBusy(true); setDelErr(null); setDelOut(null);
    try {
      const r = await fetch(`/api/monoova/token/item/${encodeURIComponent(delToken)}?env=${mode}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setDelOut(j);
    } catch (e: any) { setDelErr(e?.message || String(e)); }
    finally { setDelBusy(false); }
  }

  // ===== Public Endpoints =====
  const [pubBusy, setPubBusy] = useState(false);
  const [pingOut, setPingOut] = useState<any | null>(null);
  const [pingErr, setPingErr] = useState<string | null>(null);

  // Updated state: store both PEM and raw DER (base64) for cert; PEM for key
  const [certBusy, setCertBusy] = useState(false);
  const [certPem, setCertPem] = useState<string>("");     // pretty-printed PEM for textarea/copy
  const [certB64, setCertB64] = useState<string>("");     // base64 DER for .cer download
  const [certErr, setCertErr] = useState<string | null>(null);

  const [keyBusy, setKeyBusy] = useState(false);
  const [keyPem, setKeyPem] = useState<string>("");       // PEM for textarea/copy/download
  const [keyErr, setKeyErr] = useState<string | null>(null);

  async function doPing() {
    setPubBusy(true); setPingErr(null); setPingOut(null);
    try {
      const r = await fetch(`/api/monoova/public/ping?env=${mode}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setPingOut(j);
    } catch (e:any) { setPingErr(e?.message || String(e)); }
    finally { setPubBusy(false); }
  }

  async function getWebhookCert() {
    setCertBusy(true); setCertErr(null); setCertPem(""); setCertB64("");
    try {
      const r = await fetch(`/api/monoova/public/webhook-cert?env=${mode}`, { cache: "no-store" });
      const ct = (r.headers.get("content-type") || "").toLowerCase();

      if (!r.ok) {
        const msg = ct.includes("json") ? JSON.stringify(await r.json()) : await r.text();
        throw new Error(msg.slice(0, 500));
      }

      if (ct.includes("application/octet-stream")) {
        // upstream returned DER; turn into PEM + keep base64 for .cer
        const buf = await r.arrayBuffer();
        const b64 = uint8ToBase64(new Uint8Array(buf));
        setCertB64(b64);
        setCertPem(wrapPem(b64, "CERTIFICATE"));
      } else {
        // Fallback: show whatever text we got (should rarely happen now)
        const body = ct.includes("json") ? JSON.stringify(await r.json(), null, 2) : await r.text();
        setCertPem(typeof body === "string" ? body : String(body));
      }
    } catch (e:any) { setCertErr(e?.message || String(e)); }
    finally { setCertBusy(false); }
  }

  async function getPublicKey() {
    setKeyBusy(true); setKeyErr(null); setKeyPem("");
    try {
      const r = await fetch(`/api/monoova/public/public-key?env=${mode}`, { cache: "no-store" });
      const ct = (r.headers.get("content-type") || "").toLowerCase();

      if (!r.ok) {
        const msg = ct.includes("json") ? JSON.stringify(await r.json()) : await r.text();
        throw new Error(msg.slice(0, 500));
      }

      if (ct.includes("application/octet-stream")) {
        const buf = await r.arrayBuffer();
        const b64 = uint8ToBase64(new Uint8Array(buf));
        setKeyPem(wrapPem(b64, "PUBLIC KEY"));
      } else {
        // If Monoova ever returns a hex key, convert to PEM; else show text/JSON
        const body = await r.text();
        const hexLike = /^[0-9a-f]+$/i.test(body.trim());
        if (hexLike) {
          const bytes: number[] = [];
          for (let i = 0; i < body.length; i += 2) {
            bytes.push(parseInt(body.slice(i, i + 2), 16));
          }
          const b64 = uint8ToBase64(Uint8Array.from(bytes));
          setKeyPem(wrapPem(b64, "PUBLIC KEY"));
        } else {
          setKeyPem(body);
        }
      }
    } catch (e:any) { setKeyErr(e?.message || String(e)); }
    finally { setKeyBusy(false); }
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

      {/* ===== Security & Tokens ===== */}
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
          {secOut && <pre className="mt-2 text-xs bg-surface border border-outline/40 rounded-lg p-3 overflow-auto">{JSON.stringify(secOut, null, 2)}</pre>}
        </div>

        {/* Sign-in settings */}
        <div className="p-4 border-b border-outline/30">
          <div className="text-sm font-medium mb-2">Sign-in account settings</div>
          <button
            onClick={getSignInSettings}
            disabled={signBusy}
            className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm disabled:opacity-60"
          >
            {signBusy ? "Loading…" : "Fetch settings"}
          </button>
          {signErr && <div className="mt-2 text-amber-300 text-xs">{signErr}</div>}
          {signOut && <pre className="mt-2 text-xs bg-surface border border-outline/40 rounded-lg p-3 overflow-auto">{JSON.stringify(signOut, null, 2)}</pre>}
        </div>

        {/* Change password */}
        <div className="p-4 border-b border-outline/30">
          <div className="text-sm font-medium mb-2">Change password</div>
          <div className="grid md:grid-cols-3 gap-2 text-sm">
            <input type="password" className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Old password" value={oldPw} onChange={e=>setOldPw(e.target.value)} />
            <input type="password" className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="New password" value={newPw} onChange={e=>setNewPw(e.target.value)} />
            <input type="password" className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Confirm new password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} />
          </div>
          <div className="mt-2">
            <button
              onClick={changePassword}
              disabled={pwBusy || !oldPw || !newPw || !confirmPw}
              className="px-3 h-9 rounded-lg bg-black text-white text-sm disabled:opacity-60"
            >
              {pwBusy ? "Changing…" : "Change password"}
            </button>
          </div>
          {pwErr && <div className="mt-2 text-amber-300 text-xs">{pwErr}</div>}
          {pwOut && <pre className="mt-2 text-xs bg-surface border border-outline/40 rounded-lg p-3 overflow-auto">{JSON.stringify(pwOut, null, 2)}</pre>}
        </div>

        {/* Create token – Australian bank account */}
        <div className="p-4 border-b border-outline/30">
          <div className="text-sm font-medium mb-2">Create token – Australian bank account</div>
          <div className="grid md:grid-cols-5 gap-2 text-sm">
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="mAccount (e.g. 6279…)" value={mAccount} onChange={e=>setMAccount(e.target.value)} />
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="BSB (e.g. 062000)" value={bsb} onChange={e=>setBsb(e.target.value)} />
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Account number" value={acct} onChange={e=>setAcct(e.target.value)} />
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Account name (optional)" value={acctName} onChange={e=>setAcctName(e.target.value)} />
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Nickname (optional)" value={nickname} onChange={e=>setNickname(e.target.value)} />
          </div>
          <div className="mt-2">
            <button
              onClick={createBankToken}
              disabled={createBusy || !mAccount || !bsb || !acct}
              className="px-3 h-9 rounded-lg bg-[#6d44c9] hover:bg-[#5a36a6] text-sm font-semibold disabled:opacity-60"
            >
              {createBusy ? "Creating…" : "Create token"}
            </button>
          </div>
          {createErr && <div className="mt-2 text-amber-300 text-xs">{createErr}</div>}
          {createOut && <pre className="mt-2 text-xs bg-surface border border-outline/40 rounded-lg p-3 overflow-auto">{JSON.stringify(createOut, null, 2)}</pre>}
        </div>

        {/* List tokens for mAccount */}
        <div className="p-4 border-b border-outline/30">
          <div className="text-sm font-medium mb-2">List tokens (by mAccount)</div>
          <div className="flex items-center gap-2">
            <input className="flex-1 bg-surface border border-outline/40 rounded px-2 py-1 text-sm" placeholder="mAccount (e.g. 6279…)" value={mAccount} onChange={e=>setMAccount(e.target.value)} />
            <button
              onClick={listTokens}
              disabled={listBusy || !mAccount}
              className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm disabled:opacity-60"
            >
              {listBusy ? "Loading…" : "List tokens"}
            </button>
          </div>
          {listErr && <div className="mt-2 text-amber-300 text-xs">{listErr}</div>}
          {listOut && (
            <div className="mt-2">
              {Array.isArray(listOut.rows) && listOut.rows.length > 0 ? (
                <div className="overflow-auto">
                  <table className="w-full text-xs border border-outline/30 rounded-lg">
                    <thead className="bg-surface/60">
                      <tr className="text-subt">
                        <th className="text-left p-2">Token</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Nickname</th>
                        <th className="text-left p-2">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listOut.rows.map((r: any) => (
                        <tr key={r.token} className="border-t border-outline/30">
                          <td className="p-2 font-mono">{r.token}</td>
                          <td className="p-2">{r.type || "—"}</td>
                          <td className="p-2">{r.nickname || "—"}</td>
                          <td className="p-2">{r.createdAt || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs text-subt">No tokens found.</div>
              )}
            </div>
          )}
        </div>

        {/* Get / Update / Delete token */}
        <div className="p-4">
          <div className="text-sm font-medium mb-3">Manage token</div>

          {/* Get details */}
          <div className="grid md:grid-cols-3 gap-2 text-sm mb-3">
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Token" value={getToken} onChange={e=>setGetToken(e.target.value)} />
            <button
              onClick={getTokenDetails}
              disabled={getBusy || !getToken}
              className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm disabled:opacity-60"
            >
              {getBusy ? "Fetching…" : "Get details"}
            </button>
          </div>
          {getErr && <div className="mt-1 text-amber-300 text-xs">{getErr}</div>}
          {getOut && <pre className="mt-2 text-xs bg-surface border border-outline/40 rounded-lg p-3 overflow-auto">{JSON.stringify(getOut, null, 2)}</pre>}

          {/* Update nickname */}
          <div className="grid md:grid-cols-3 gap-2 text-sm mt-4">
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Token" value={updToken} onChange={e=>setUpdToken(e.target.value)} />
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="New nickname" value={updNickname} onChange={e=>setUpdNickname(e.target.value)} />
            <button
              onClick={updateTokenNickname}
              disabled={updBusy || !updToken}
              className="px-3 h-9 rounded-lg bg-black text-white text-sm disabled:opacity-60"
            >
              {updBusy ? "Updating…" : "Update nickname"}
            </button>
          </div>
          {updErr && <div className="mt-1 text-amber-300 text-xs">{updErr}</div>}
          {updOut && <pre className="mt-2 text-xs bg-surface border border-outline/40 rounded-lg p-3 overflow-auto">{JSON.stringify(updOut, null, 2)}</pre>}

          {/* Delete */}
          <div className="grid md:grid-cols-3 gap-2 text-sm mt-4">
            <input className="bg-surface border border-outline/40 rounded px-2 py-1" placeholder="Token" value={delToken} onChange={e=>setDelToken(e.target.value)} />
            <button
              onClick={deleteToken}
              disabled={delBusy || !delToken}
              className="px-3 h-9 rounded-lg bg-[#b53b3b] text-white text-sm disabled:opacity-60"
            >
              {delBusy ? "Deleting…" : "Delete token"}
            </button>
          </div>
          {delErr && <div className="mt-1 text-amber-300 text-xs">{delErr}</div>}
          {delOut && <pre className="mt-2 text-xs bg-surface border border-outline/40 rounded-lg p-3 overflow-auto">{JSON.stringify(delOut, null, 2)}</pre>}
        </div>
      </section>

      {/* ===== Public Endpoints ===== */}
      <section className="bg-panel border border-outline/40 rounded-xl2">
        <div className="p-4 border-b border-outline/40 text-sm font-medium">
          Public Endpoints <span className="text-subt">({String(mode)})</span>
        </div>

        {/* Ping */}
        <div className="p-4 border-b border-outline/30">
          <div className="text-sm font-medium mb-2">Ping</div>
          <button
            onClick={doPing}
            disabled={pubBusy}
            className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm disabled:opacity-60"
          >
            {pubBusy ? "Pinging…" : "Ping"}
          </button>
          {pingErr && <div className="mt-2 text-amber-300 text-xs">{pingErr}</div>}
          {pingOut && <pre className="mt-2 text-xs bg-surface border border-outline/40 rounded-lg p-3 overflow-auto">{JSON.stringify(pingOut, null, 2)}</pre>}
        </div>

        {/* Webhook Signing Certificate */}
        <div className="p-4 border-b border-outline/30">
          <div className="text-sm font-medium mb-2">Webhook Signing Certificate</div>
          <div className="flex gap-2">
            <button
              onClick={getWebhookCert}
              disabled={certBusy}
              className="px-3 h-9 rounded-lg bg-[#6d44c9] hover:bg-[#5a36a6] text-sm font-semibold disabled:opacity-60"
            >
              {certBusy ? "Fetching…" : "Get certificate"}
            </button>
            <button
              onClick={() => certB64 && downloadBlob(`monoova-webhook-${mode}.cer`, base64ToUint8(certB64), "application/pkix-cert")}
              disabled={!certB64}
              className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm disabled:opacity-60"
            >
              Download .cer
            </button>
            <button
              onClick={() => certPem && copyToClipboard(certPem)}
              disabled={!certPem}
              className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm disabled:opacity-60"
            >
              Copy
            </button>
          </div>
          {certErr && <div className="mt-2 text-amber-300 text-xs">{certErr}</div>}
          {certPem && (
            <textarea
              className="mt-2 w-full min-h-[160px] bg-surface border border-outline/40 rounded-lg p-3 text-xs font-mono"
              value={certPem}
              readOnly
            />
          )}
        </div>

        {/* Retrieve Public Key */}
        <div className="p-4">
          <div className="text-sm font-medium mb-2">Retrieve Public Key</div>
          <div className="flex gap-2">
            <button
              onClick={getPublicKey}
              disabled={keyBusy}
              className="px-3 h-9 rounded-lg bg-[#6d44c9] hover:bg-[#5a36a6] text-sm font-semibold disabled:opacity-60"
            >
              {keyBusy ? "Fetching…" : "Get public key"}
            </button>
            <button
              onClick={() => keyPem && downloadBlob(`monoova-public-key-${mode}.pem`, keyPem, "application/x-pem-file")}
              disabled={!keyPem}
              className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm disabled:opacity-60"
            >
              Download .pem
            </button>
            <button
              onClick={() => keyPem && copyToClipboard(keyPem)}
              disabled={!keyPem}
              className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm disabled:opacity-60"
            >
              Copy
            </button>
          </div>
          {keyErr && <div className="mt-2 text-amber-300 text-xs">{keyErr}</div>}
          {keyPem && (
            <textarea
              className="mt-2 w-full min-h-[140px] bg-surface border border-outline/40 rounded-lg p-3 text-xs font-mono"
              value={keyPem}
              readOnly
            />
          )}
        </div>
      </section>
    </div>
  );
}