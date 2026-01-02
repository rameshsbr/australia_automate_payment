// app/(app)/developer/webhooks/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  kind: string;
  receivedAt: string;
  verified: boolean;
  note?: string | null;
  payload: any;
};

function pretty(obj: any) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

type IntervalOpt = 0 | 5 | 15 | 30;

export default function WebhooksViewer() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  // kind chips
  const kinds = useMemo(
    () => Array.from(new Set(rows.map((r) => r.kind))).sort(),
    [rows]
  );
  const [kindFilter, setKindFilter] = useState<string | null>(null);

  // auto-refresh
  const [intervalSec, setIntervalSec] = useState<IntervalOpt>(0);

  // ---- Payload modal
  const [openPayload, setOpenPayload] = useState<null | Row>(null);

  // ---- Replay modal
  const [replayRow, setReplayRow] = useState<null | Row>(null);
  const [replayBusy, setReplayBusy] = useState(false);

  const defaultTarget = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_WEBHOOK_HINT_BASE_URL?.replace(/\/+$/, "") ||
      (typeof window !== "undefined" ? window.location.origin : "");
    return base ? `${base}/api/webhooks/provider` : "";
  }, []);

  const [targetUrl, setTargetUrl] = useState(defaultTarget);
  const [sendSig, setSendSig] = useState(true);
  const [headerName, setHeaderName] = useState<"x-monoova-signature" | "x-webhook-signature">(
    "x-monoova-signature"
  );

  async function load() {
    setBusy(true);
    try {
      const r = await fetch("/api/webhooks/list?limit=100", { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setRows(j.rows ?? []);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // auto refresh timer
  useEffect(() => {
    if (!intervalSec) return;
    const t = setInterval(load, intervalSec * 1000);
    return () => clearInterval(t);
  }, [intervalSec]);

  function matches(row: Row, term: string) {
    if (kindFilter && row.kind !== kindFilter) return false;
    if (!term) return true;
    const t = term.toLowerCase();
    return (
      row.kind.toLowerCase().includes(t) ||
      (row.note || "").toLowerCase().includes(t) ||
      pretty(row.payload).toLowerCase().includes(t)
    );
  }

  const filtered = rows.filter((r) => matches(r, q));

  async function doReplay(row: Row) {
    setReplayBusy(true);
    try {
      const res = await fetch(`/api/webhooks/replay?id=${encodeURIComponent(row.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: targetUrl || undefined,
          sendSignature: Boolean(sendSig),
          headerName,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j?.error || res.statusText);
      } else {
        alert("Sent 🎉");
      }
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setReplayBusy(false);
    }
  }

  function asCurl(row: Row) {
    const headerBit = sendSig
      ? `-H "${headerName}: ${process.env.NEXT_PUBLIC_WEBHOOK_SECRET || "<YOUR_SECRET>"}"`
      : "";
    const url = targetUrl || "<TARGET_URL>";
    const body = pretty(row.payload).replaceAll('"', '\\"');
    return `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  ${headerBit}${headerBit ? " \\\n  " : ""}-d "${body}"`;
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-medium">Webhooks</h1>

        {/* kind chips */}
        <div className="flex items-center gap-2 ml-2">
          <button
            className={classNames(
              "text-xs rounded px-2 py-1 border",
              !kindFilter ? "bg-surface" : "bg-panel"
            )}
            onClick={() => setKindFilter(null)}
          >
            All
          </button>
          {kinds.map((k) => (
            <button
              key={k}
              className={classNames(
                "text-xs rounded px-2 py-1 border",
                kindFilter === k ? "bg-surface" : "bg-panel"
              )}
              onClick={() => setKindFilter(k === kindFilter ? null : k)}
              title={k}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            className="bg-panel border border-outline/40 rounded px-2 py-1 text-sm"
            value={intervalSec}
            onChange={(e) => setIntervalSec(Number(e.target.value) as IntervalOpt)}
            title="Auto refresh"
          >
            <option value={0}>Auto: Off</option>
            <option value={5}>Auto: 5s</option>
            <option value={15}>Auto: 15s</option>
            <option value={30}>Auto: 30s</option>
          </select>

          <input
            className="bg-panel border border-outline/40 rounded px-2 py-1 text-sm w-[320px]"
            placeholder="Search kind, note, or payload…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <button
            className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm"
            onClick={load}
            disabled={busy}
          >
            {busy ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="border border-outline/40 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface/60">
            <tr className="text-subt">
              <th className="text-left p-2">When</th>
              <th className="text-left p-2">Kind</th>
              <th className="text-left p-2">Verified</th>
              <th className="text-left p-2">Note</th>
              <th className="text-left p-2 w-[520px]">Payload</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={6}>
                  No events
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-outline/30 align-top">
                  <td className="p-2 whitespace-nowrap">
                    {new Date(r.receivedAt).toLocaleString()}
                  </td>
                  <td className="p-2">{r.kind}</td>
                  <td className="p-2">{r.verified ? "yes" : "no"}</td>
                  <td className="p-2">{r.note || "-"}</td>
                  <td className="p-2">
                    <div className="relative">
                      <pre className="max-w-[520px] max-h-[120px] overflow-auto text-xs bg-panel rounded p-2 border border-outline/30">
                        {pretty(r.payload)}
                      </pre>
                      <div className="mt-1 text-xs">
                        <button
                          className="text-subt hover:underline"
                          onClick={() => setOpenPayload(r)}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <button
                      className="text-subt hover:underline"
                      onClick={() => {
                        setReplayRow(r);
                        setTargetUrl(defaultTarget);
                        setSendSig(true);
                        setHeaderName("x-monoova-signature");
                      }}
                    >
                      Replay
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ----- Payload modal ----- */}
      {openPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-outline/40 rounded-xl w-[min(1000px,92vw)] max-h-[80vh] shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline/30">
              <div className="font-medium text-sm">
                Payload – <span className="text-subt">{openPayload.kind}</span>
              </div>
              <button
                className="text-subt hover:text-white text-sm"
                onClick={() => setOpenPayload(null)}
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <pre className="text-xs bg-panel rounded p-3 border border-outline/30 overflow-auto max-h-[60vh]">
                {pretty(openPayload.payload)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ----- Replay modal ----- */}
      {replayRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-outline/40 rounded-xl w-[min(720px,92vw)] shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline/30">
              <div className="font-medium text-sm">
                Replay webhook – <span className="text-subt">{replayRow.kind}</span>
              </div>
              <button
                className="text-subt hover:text-white text-sm"
                onClick={() => setReplayRow(null)}
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-subt">Target URL</label>
                <input
                  className="w-full bg-panel border border-outline/40 rounded px-2 py-1 text-sm"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://<ngrok>/api/webhooks/provider"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sendSig}
                    onChange={(e) => setSendSig(e.target.checked)}
                  />
                  <span>Send signature header</span>
                </label>

                <select
                  className={classNames(
                    "border border-outline/40 rounded px-2 py-1 text-sm bg-panel",
                    !sendSig && "opacity-60"
                  )}
                  value={headerName}
                  onChange={(e) =>
                    setHeaderName(e.target.value as "x-monoova-signature" | "x-webhook-signature")
                  }
                  disabled={!sendSig}
                >
                  <option value="x-monoova-signature">x-monoova-signature</option>
                  <option value="x-webhook-signature">x-webhook-signature</option>
                </select>

                {!!process.env.NEXT_PUBLIC_WEBHOOK_SECRET ? (
                  <span className="text-xs text-subt">
                    using <code className="font-mono">NEXT_PUBLIC_WEBHOOK_SECRET</code>
                  </span>
                ) : (
                  <span className="text-xs text-amber-400">
                    set <code className="font-mono">NEXT_PUBLIC_WEBHOOK_SECRET</code> for cURL
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-subt">Copy cURL</span>
                  <button
                    className="text-xs underline decoration-dotted"
                    onClick={() => copy(asCurl(replayRow))}
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-[11px] bg-panel border border-outline/40 rounded p-2 overflow-auto max-h-40">
{asCurl(replayRow)}
                </pre>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  className="px-3 py-2 border border-outline/40 rounded"
                  onClick={() => setReplayRow(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
                  disabled={replayBusy}
                  onClick={() => doReplay(replayRow)}
                >
                  {replayBusy ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}