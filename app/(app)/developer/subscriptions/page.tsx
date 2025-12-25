"use client";

import React, { useEffect, useMemo, useState } from "react";

type Env = "sandbox" | "live";
type Service = "legacy";

type Row = {
  service: Service;
  subscriptionId: string;
  subscriptionName?: string;
  eventName: string;
  callbackUrl: string;
  isActive: boolean;
  emailTo?: string[];
  emailBcc?: string[];
};

const LEGACY_EVENTS = [
  "nppreceivepayment",
  "paytoreceivepayment",
  "inbounddirectcredit",
  "directdebitclearance",
  "directentrydishonour",
  "pendinginboundrtgsimt",
  "inboundrtgsimtstatus",
  "inbounddirectdebit",
  "nppreturn",
  "npppaymentstatus",
  "inbounddirectcreditrejections",
  "nppcreditrejections",
] as const;

/** helpful prefill for callback based on event */
const EVENT_TO_ROUTE: Record<string, string> = {
  npppaymentstatus: "/api/webhooks/monoova/npp-payment-status",
  nppreturn: "/api/webhooks/monoova/npp-payment-return",
  nppreceivepayment: "/api/webhooks/monoova/receive-payment",
  inbounddirectcredit: "/api/webhooks/monoova/inbound-direct-credit",
  inbounddirectdebit: "/api/webhooks/monoova/inbound-direct-debit",
  directentrydishonour: "/api/webhooks/monoova/direct-entry-dishonours",
  inboundrtgsimtstatus: "/api/webhooks/monoova/rtgs-imt-status",
  pendinginboundrtgsimt: "/api/webhooks/monoova/rtgs-imt-status",
  inbounddirectcreditrejections: "/api/webhooks/monoova/inbound-direct-credit",
  nppcreditrejections: "/api/webhooks/monoova/npp-payment-status",
  paytoreceivepayment: "/api/webhooks/monoova/receive-payment",
};

export default function DeveloperSubscriptionsPage() {
  const [env, setEnv] = useState<Env>("sandbox");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    subscriptionName: "",
    eventName: LEGACY_EVENTS[0] as string,
    callbackUrl: "",
    emailTo: "",
    emailBcc: "",
  });

  const apiKeyHeader = (): HeadersInit => {
    const k = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY || "";
    return { "x-api-key": k };
  };

  const hintBase = process.env.NEXT_PUBLIC_WEBHOOK_HINT_BASE_URL || "";

  function prefillCallback(nextEvent: string) {
    const suffix = EVENT_TO_ROUTE[nextEvent] || "/api/webhooks/monoova/npp-payment-status";
    if (!hintBase || !/^https:\/\//i.test(hintBase)) return suffix; // fall back
    return `${hintBase.replace(/\/+$/,"")}${suffix}`;
  }

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/manage/subscriptions?env=${env}&service=legacy`, {
        headers: apiKeyHeader(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      setRows(json.rows ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env]);

  function startCreate() {
    const eventName = LEGACY_EVENTS[0] as string;
    setForm({
      subscriptionName: "",
      eventName,
      callbackUrl: prefillCallback(eventName),
      emailTo: "",
      emailBcc: "",
    });
    setCreating(true);
  }

  async function submitCreate() {
    if (!/^https:\/\//i.test(form.callbackUrl)) {
      alert("Callback URL must be HTTPS (use your ngrok https URL).");
      return;
    }

    const payload = {
      subscriptionName: form.subscriptionName || undefined,
      eventName: form.eventName.trim(),
      callbackUrl: form.callbackUrl.trim(),
      // legacy ignores isActive/email fields, but API accepts them in our handler safely
      emailTo: form.emailTo ? form.emailTo.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      emailBcc: form.emailBcc ? form.emailBcc.split(",").map(s => s.trim()).filter(Boolean) : undefined,
    };

    const res = await fetch(`/api/manage/subscriptions?env=${env}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID(), ...apiKeyHeader() },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json?.error || res.statusText);
      return;
    }
    setCreating(false);
    await fetchList();
  }

  function startEdit(row: Row) {
    setEditing(row);
    setForm({
      subscriptionName: row.subscriptionName ?? "",
      eventName: row.eventName,
      callbackUrl: row.callbackUrl || prefillCallback(row.eventName),
      emailTo: (row.emailTo ?? []).join(","),
      emailBcc: (row.emailBcc ?? []).join(","),
    });
  }

  async function submitEdit() {
    if (!editing) return;
    if (!/^https:\/\//i.test(form.callbackUrl)) {
      alert("Callback URL must be HTTPS.");
      return;
    }
    const payload = {
      subscriptionName: form.subscriptionName || undefined,
      eventName: form.eventName.trim(),
      callbackUrl: form.callbackUrl.trim(),
      emailTo: form.emailTo ? form.emailTo.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      emailBcc: form.emailBcc ? form.emailBcc.split(",").map(s => s.trim()).filter(Boolean) : undefined,
    };

    const res = await fetch(`/api/manage/subscriptions?env=${env}&id=${encodeURIComponent(editing.subscriptionId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID(), ...apiKeyHeader() },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json?.error || res.statusText);
      return;
    }
    setEditing(null);
    await fetchList();
  }

  async function remove(row: Row) {
    if (!confirm(`Delete subscription ${row.subscriptionId}?`)) return;
    const res = await fetch(`/api/manage/subscriptions?env=${env}&id=${encodeURIComponent(row.subscriptionId)}`, {
      method: "DELETE",
      headers: apiKeyHeader(),
    });
    if (!res.ok && res.status !== 204) {
      const json = await res.json().catch(() => ({}));
      alert(json?.error || res.statusText);
      return;
    }
    await fetchList();
  }

  // ----- Legacy-only helpers in UI -----
  async function resendLegacy() {
    const webhookId = prompt("Enter webhook delivery id to resend:");
    if (!webhookId) return;
    const res = await fetch(`/api/manage/subscriptions?env=${env}&action=resend&id=${encodeURIComponent(webhookId)}`, {
      method: "POST",
      headers: apiKeyHeader(),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { alert(j?.error || res.statusText); return; }
    alert("Resend triggered.");
  }

  async function reportLegacy() {
    const date = prompt("Enter date (YYYY-MM-DD) for report:");
    if (!date) return;
    const res = await fetch(`/api/manage/subscriptions?env=${env}&action=report&date=${encodeURIComponent(date)}`, {
      headers: apiKeyHeader(),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { alert(j?.error || res.statusText); return; }
    // show raw JSON quickly; you can pretty this up later
    alert("Report fetched (see console).");
    console.log("Legacy Report", j);
  }

  // UI
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Subscriptions</h1>
        <span className="text-xs rounded px-2 py-1 border">Service: legacy</span>
        <div className="ml-auto flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={resendLegacy}>Resend (legacy)</button>
          <button className="px-3 py-2 border rounded" onClick={reportLegacy}>Report (legacy)</button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <label className="text-sm">Environment</label>
        <select className="border px-2 py-1 rounded" value={env} onChange={(e) => setEnv(e.target.value as Env)}>
          <option value="sandbox">sandbox</option>
          <option value="live">live</option>
        </select>

        <button onClick={startCreate} className="ml-auto bg-black text-white px-3 py-2 rounded">
          + New Subscription
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Event</th>
              <th className="p-2">Callback URL</th>
              <th className="p-2">Active</th>
              <th className="p-2">Emails</th>
              <th className="p-2 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={7}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-4" colSpan={7}>No subscriptions</td></tr>
            ) : rows.map((r) => (
              <tr key={r.subscriptionId} className="border-t">
                <td className="p-2 font-mono">{r.subscriptionId}</td>
                <td className="p-2">{r.subscriptionName ?? "-"}</td>
                <td className="p-2">{r.eventName}</td>
                <td className="p-2 truncate max-w-[320px]">{r.callbackUrl}</td>
                <td className="p-2">{r.isActive ? "Yes" : "No"}</td>
                <td className="p-2">
                  <div className="text-xs">
                    {r.emailTo?.length ? <div>to: {r.emailTo.join(", ")}</div> : null}
                    {r.emailBcc?.length ? <div>bcc: {r.emailBcc.join(", ")}</div> : null}
                    {!r.emailTo?.length && !r.emailBcc?.length ? "-" : null}
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={() => startEdit(r)}>Edit</button>
                    <button className="px-2 py-1 border rounded" onClick={() => remove(r)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{creating ? "Create Subscription" : "Edit Subscription"}</h2>
              <button className="text-sm underline" onClick={() => { setCreating(false); setEditing(null); }}>Close</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-600">Event Name</label>
                <select
                  className="w-full border px-2 py-1 rounded"
                  value={form.eventName}
                  onChange={(e) => {
                    const ev = e.target.value;
                    setForm(f => ({
                      ...f,
                      eventName: ev,
                      callbackUrl: creating ? prefillCallback(ev) : f.callbackUrl
                    }));
                  }}
                  disabled={!!editing}
                >
                  {LEGACY_EVENTS.map((ev) => (
                    <option key={ev as string} value={ev as string}>{ev as string}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600">Subscription Name (optional)</label>
                <input
                  className="w-full border px-2 py-1 rounded"
                  value={form.subscriptionName}
                  onChange={(e) => setForm((f) => ({ ...f, subscriptionName: e.target.value }))}
                  placeholder="Ops – NPP Status"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600">Callback URL (must be HTTPS)</label>
                <input
                  className="w-full border px-2 py-1 rounded"
                  value={form.callbackUrl}
                  onChange={(e) => setForm((f) => ({ ...f, callbackUrl: e.target.value }))}
                  placeholder="https://<ngrok>/api/webhooks/monoova/npp-payment-status"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600">Email To (comma separated)</label>
                <input
                  className="w-full border px-2 py-1 rounded"
                  value={form.emailTo}
                  onChange={(e) => setForm((f) => ({ ...f, emailTo: e.target.value }))}
                  placeholder="ops@example.com, support@example.com"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600">Email BCC (comma separated)</label>
                <input
                  className="w-full border px-2 py-1 rounded"
                  value={form.emailBcc}
                  onChange={(e) => setForm((f) => ({ ...f, emailBcc: e.target.value }))}
                  placeholder="audit@example.com"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button className="border px-3 py-2 rounded" onClick={() => { setCreating(false); setEditing(null); }}>
                Cancel
              </button>
              {creating ? (
                <button className="bg-black text-white px-3 py-2 rounded" onClick={submitCreate}>
                  Create
                </button>
              ) : (
                <button className="bg-black text-white px-3 py-2 rounded" onClick={submitEdit}>
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
