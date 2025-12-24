// app/(app)/manage/subscriptions/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

type Env = "sandbox" | "live";
type Service = "notification" | "legacy";

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

const NOTIFICATION_EVENTS = [
  "paymentagreementnotification",
  "paymentinstructionnotification",
  "creditcardpaymentnotification",
  "creditcardrefundnotification",
  "asyncjobresultnotification",
] as const;

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

export default function SubscriptionsPage() {
  const [env, setEnv] = useState<Env>("sandbox");
  const [service, setService] = useState<Service>("notification");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    subscriptionName: "",
    eventName: NOTIFICATION_EVENTS[0],
    callbackUrl: "",
    isActive: true,
    emailTo: "",
    emailBcc: "",
  });

  const eventOptions = useMemo(() => {
    return service === "notification" ? NOTIFICATION_EVENTS : LEGACY_EVENTS;
  }, [service]);

  const apiKeyHeader = (): HeadersInit => {
    // why: let your middleware inject this automatically if you use a real key; for local dev you may hardcode a sandbox key
    const h: Record<string, string> = { "x-api-key": "test_sandbox_key" };
    return h;
  };

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/manage/subscriptions?env=${env}&service=${service}`, {
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
  }, [env, service]);

  function startCreate() {
    setForm({
      subscriptionName: "",
      eventName: (eventOptions[0] as string) || "",
      callbackUrl: "",
      isActive: true,
      emailTo: "",
      emailBcc: "",
    });
    setCreating(true);
  }

  async function submitCreate() {
    const payload = {
      subscriptionName: form.subscriptionName || undefined,
      eventName: form.eventName.trim(),
      callbackUrl: form.callbackUrl.trim(),
      isActive: service === "notification" ? form.isActive : undefined,
      emailTo: form.emailTo
        ? form.emailTo.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      emailBcc: form.emailBcc
        ? form.emailBcc.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
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
    setService(row.service); // align event options
    setForm({
      subscriptionName: row.subscriptionName ?? "",
      eventName: row.eventName,
      callbackUrl: row.callbackUrl,
      isActive: row.isActive,
      emailTo: (row.emailTo ?? []).join(","),
      emailBcc: (row.emailBcc ?? []).join(","),
    });
  }

  async function submitEdit() {
    if (!editing) return;
    const payload = {
      subscriptionName: form.subscriptionName || undefined,
      eventName: form.eventName.trim(),
      callbackUrl: form.callbackUrl.trim(),
      isActive: editing.service === "notification" ? form.isActive : undefined,
      emailTo: form.emailTo
        ? form.emailTo.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      emailBcc: form.emailBcc
        ? form.emailBcc.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Subscriptions</h1>

      <div className="flex gap-4 items-center">
        <label className="text-sm">Environment</label>
        <select className="border px-2 py-1 rounded" value={env} onChange={(e) => setEnv(e.target.value as Env)}>
          <option value="sandbox">sandbox</option>
          <option value="live">live</option>
        </select>

        <label className="text-sm ml-4">Service</label>
        <select className="border px-2 py-1 rounded" value={service} onChange={(e) => setService(e.target.value as Service)}>
          <option value="notification">notification (NM)</option>
          <option value="legacy">legacy</option>
        </select>

        <button
          onClick={startCreate}
          className="ml-auto bg-black text-white px-3 py-2 rounded"
        >
          + New Subscription
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-2">Service</th>
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
              <tr><td className="p-4" colSpan={8}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-4" colSpan={8}>No subscriptions</td></tr>
            ) : rows.map((r) => (
              <tr key={`${r.service}-${r.subscriptionId}`} className="border-t">
                <td className="p-2">{r.service}</td>
                <td className="p-2 font-mono">{r.subscriptionId}</td>
                <td className="p-2">{r.subscriptionName ?? "-"}</td>
                <td className="p-2">{r.eventName}</td>
                <td className="p-2 truncate max-w-[280px]">{r.callbackUrl}</td>
                <td className="p-2">{r.isActive ? "Yes" : "No"}</td>
                <td className="p-2">
                  <div className="text-xs">
                    {r.emailTo && r.emailTo.length > 0 && <div>to: {r.emailTo.join(", ")}</div>}
                    {r.emailBcc && r.emailBcc.length > 0 && <div>bcc: {r.emailBcc.join(", ")}</div>}
                    {!r.emailTo?.length && !r.emailBcc?.length && "-"}
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
              <div>
                <label className="text-xs text-gray-600">Service</label>
                <select
                  className="w-full border px-2 py-1 rounded"
                  value={service}
                  onChange={(e) => setService(e.target.value as Service)}
                  disabled={!creating}
                >
                  <option value="notification">notification (NM)</option>
                  <option value="legacy">legacy</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600">Event Name</label>
                <select
                  className="w-full border px-2 py-1 rounded"
                  value={form.eventName}
                  onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
                >
                  {eventOptions.map((ev) => (
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
                  placeholder="Ops Alerts, PayTo PI, etc."
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600">Callback URL</label>
                <input
                  className="w-full border px-2 py-1 rounded"
                  value={form.callbackUrl}
                  onChange={(e) => setForm((f) => ({ ...f, callbackUrl: e.target.value }))}
                  placeholder="https://yourapp.com/webhooks/monoova"
                />
              </div>

              {service === "notification" && (
                <div>
                  <label className="text-xs text-gray-600">Active</label>
                  <select
                    className="w-full border px-2 py-1 rounded"
                    value={form.isActive ? "true" : "false"}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "true" }))}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </div>
              )}

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
