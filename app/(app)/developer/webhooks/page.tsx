// app/(app)/developer/webhooks/page.tsx
"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  kind: string;
  receivedAt: string;
  verified: boolean;
  note?: string | null;
  payload: any;
};

export default function WebhooksViewer() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

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

  async function replay(id: string) {
    const r = await fetch(`/api/webhooks/replay?id=${encodeURIComponent(id)}`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    alert(r.ok ? "Replayed" : `Replay failed: ${j?.error || r.statusText}`);
  }

  const filtered = rows.filter(
    (r) => !q || r.kind.includes(q) || JSON.stringify(r.payload).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-medium">Webhooks</h1>
        <input
          className="ml-4 bg-panel border border-outline/40 rounded px-2 py-1 text-sm flex-1"
          placeholder="Search kind or payload…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm" onClick={load} disabled={busy}>
          Refresh
        </button>
      </div>

      <div className="border border-outline/40 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface/60">
            <tr className="text-subt">
              <th className="text-left p-2">When</th>
              <th className="text-left p-2">Kind</th>
              <th className="text-left p-2">Verified</th>
              <th className="text-left p-2">Note</th>
              <th className="text-left p-2">Payload</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td className="p-3" colSpan={6}>No events</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-t border-outline/30 align-top">
                <td className="p-2 whitespace-nowrap">{new Date(r.receivedAt).toLocaleString()}</td>
                <td className="p-2">{r.kind}</td>
                <td className="p-2">{r.verified ? "yes" : "no"}</td>
                <td className="p-2">{r.note || "-"}</td>
                <td className="p-2">
                  <pre className="max-w-[520px] overflow-auto text-xs bg-panel rounded p-2 border border-outline/30">
                    {JSON.stringify(r.payload, null, 2)}
                  </pre>
                </td>
                <td className="p-2">
                  <button className="text-subt hover:underline" onClick={() => replay(r.id)}>Replay</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
