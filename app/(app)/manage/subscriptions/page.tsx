// app/(app)/manage/subscriptions/page.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";

type Service = "notification" | "legacy";
type Env = "sandbox" | "live";

type Row = {
  service: Service;
  subscriptionId: string;
  subscriptionName?: string;
  eventName: string;
  callbackUrl: string;
  isActive: boolean;
};

const NOTIFICATION_EVENTS = [
  "paymentagreementnotification",
  "paymentinstructionnotification",
  "creditcardpaymentnotification",
  "creditcardrefundnotification",
  "asyncjobresultnotification",
];

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
];

function useWebhookHint() {
  if (typeof window === "undefined") return "";
  const fromEnv = process.env.NEXT_PUBLIC_WEBHOOK_HINT_BASE_URL?.trim();
  const base = fromEnv || window.location.origin;
  return `${base.replace(/\/$/, "")}/api/webhooks/provider`;
}

export default function SubscriptionsPage() {
  const [service, setService] = useState<Service>("notification");
  const [env, setEnv] = useState<Env>("sandbox");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const [reportDate, setReportDate] = useState<string>(""); // YYYY-MM-DD
  const [report, setReport] = useState<any | null>(null);

  const events = useMemo(() => (service === "notification" ? NOTIFICATION_EVENTS : LEGACY_EVENTS), [service]);
  const recommendedCallback = useWebhookHint();

  async function reload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/manage/subscriptions?service=${service}&env=${env}`, { cache: "no-store" });
      const data = await res.json();
      setRows(data.rows ?? []);
    } catch (e) {
      alert(`Load failed: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, env]);

  function onEdit(r?: Row) {
    setEditing(
      r ?? {
        service,
        subscriptionId: "",
        subscriptionName: "",
        eventName: events[0],
        callbackUrl: recommendedCallback,
        isActive: true,
      }
    );
  }

  async function onSave() {
    if (!editing) return;
    const isNew = !editing.subscriptionId;
    try {
      const qs = `service=${service}&env=${env}${!isNew ? `&id=${encodeURIComponent(editing.subscriptionId)}` : ""}`;
      const method = isNew ? "POST" : ("PUT" as const);
      const body = {
        subscriptionName: editing.subscriptionName || editing.eventName,
        eventName: editing.eventName,
        callbackUrl: editing.callbackUrl,
        isActive: editing.isActive,
      };
      const res = await fetch(`/api/manage/subscriptions?${qs}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      setEditing(null);
      await reload();
    } catch (e) {
      alert(`Save failed: ${e}`);
    }
  }

  async function onDelete(r: Row) {
    if (!confirm(`Delete subscription ${r.subscriptionId}?`)) return;
    try {
      const qs = `service=${r.service}&env=${env}&id=${encodeURIComponent(r.subscriptionId)}`;
      const res = await fetch(`/api/manage/subscriptions?${qs}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await reload();
    } catch (e) {
      alert(`Delete failed: ${e}`);
    }
  }

  async function onResend(r: Row) {
    if (r.service !== "legacy") return;
    try {
      const qs = `service=legacy&env=${env}&action=resend&id=${encodeURIComponent(r.subscriptionId)}`;
      const res = await fetch(`/api/manage/subscriptions?${qs}`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      alert("Resend requested.");
    } catch (e) {
      alert(`Resend failed: ${e}`);
    }
  }

  async function onFetchReport() {
    if (!reportDate) return alert("Pick a date");
    if (service !== "legacy") return alert("Report is Legacy only");
    try {
      const qs = `service=legacy&env=${env}&action=report&date=${encodeURIComponent(reportDate)}`;
      const res = await fetch(`/api/manage/subscriptions?${qs}`, { method: "GET" });
      const data = await res.json();
      setReport(data);
    } catch (e) {
      alert(`Report failed: ${e}`);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header bar matches your top styles */}
      <div className="flex items-center justify-between bg-panel border border-outline/40 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-medium">Manage → Subscriptions</h1>
          <span className="text-xs text-subt">Create, update, delete, resend (Legacy), and view webhook report (Legacy).</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-subt">Env</label>
          <select className="bg-surface border border-outline/40 rounded px-2 py-1 text-sm"
                  value={env} onChange={(e) => setEnv(e.target.value as Env)}>
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>

          <label className="text-sm text-subt ml-3">Service</label>
          <select className="bg-surface border border-outline/40 rounded px-2 py-1 text-sm"
                  value={service} onChange={(e) => setService(e.target.value as Service)}>
            <option value="notification">Notification Management</option>
            <option value="legacy">Legacy Subscriptions</option>
          </select>

          <button onClick={() => onEdit()}
                  className="ml-3 px-3 h-8 rounded-lg bg-surface border border-outline/40 text-sm hover:bg-panel/60">
            New
          </button>
        </div>
      </div>

      {/* Callback hint */}
      <div className="text-xs text-subt">
        Callback hint: <code className="bg-panel rounded px-1 py-[2px] border border-outline/30">{recommendedCallback || "/api/webhooks/provider"}</code> (use your ngrok URL in dev)
      </div>

      {/* Report tools (Legacy only) */}
      {service === "legacy" && (
        <div className="bg-panel border border-outline/40 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="text-sm">Webhook report:</div>
          <input type="date" className="bg-surface border border-outline/40 rounded px-2 py-1 text-sm"
                 value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
          <button onClick={onFetchReport}
                  className="px-3 h-8 rounded-lg bg-surface border border-outline/40 text-sm hover:bg-panel/60">
            Fetch
          </button>
          {report && <span className="text-xs text-subt">Items: {Array.isArray(report?.eventname) ? report.eventname.length : 0}</span>}
        </div>
      )}

      {/* Table */}
      <div className="border border-outline/40 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface/60">
            <tr className="text-subt">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Event</th>
              <th className="text-left p-2">Callback URL</th>
              <th className="text-left p-2">Active</th>
              <th className="text-left p-2">Service</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={6}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3" colSpan={6}>No subscriptions</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={`${r.service}-${r.subscriptionId}`} className="border-t border-outline/30">
                  <td className="p-2">{r.subscriptionName || r.eventName}</td>
                  <td className="p-2">{r.eventName}</td>
                  <td className="p-2 truncate max-w-[520px]">{r.callbackUrl}</td>
                  <td className="p-2">{r.isActive ? "Yes" : "No"}</td>
                  <td className="p-2">{r.service}</td>
                  <td className="p-2 flex items-center gap-3">
                    <button className="text-subt hover:underline" onClick={() => setEditing(r)}>Edit</button>
                    <button className="text-subt hover:underline" onClick={() => onDelete(r)}>Delete</button>
                    {r.service === "legacy" && (
                      <button className="text-subt hover:underline" onClick={() => onResend(r)}>Resend</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-surface border border-outline/40 rounded-xl p-6 w-[560px]">
            <h2 className="text-base font-medium">{editing.subscriptionId ? "Edit" : "New"} subscription</h2>
            <div className="mt-3 space-y-2">
              <label className="block text-xs text-subt">Event</label>
              <select
                className="w-full bg-panel border border-outline/40 rounded px-2 py-1 text-sm"
                value={editing.eventName}
                onChange={(e) => setEditing({ ...editing, eventName: e.target.value })}
              >
                {(service === "notification" ? NOTIFICATION_EVENTS : LEGACY_EVENTS).map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>

              <label className="block text-xs text-subt mt-2">Name (optional)</label>
              <input
                className="w-full bg-panel border border-outline/40 rounded px-2 py-1 text-sm"
                value={editing.subscriptionName ?? ""}
                onChange={(e) => setEditing({ ...editing, subscriptionName: e.target.value })}
              />

              <label className="block text-xs text-subt mt-2">Callback URL</label>
              <input
                className="w-full bg-panel border border-outline/40 rounded px-2 py-1 text-sm"
                value={editing.callbackUrl}
                onChange={(e) => setEditing({ ...editing, callbackUrl: e.target.value })}
              />

              <label className="inline-flex items-center gap-2 mt-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                />
                <span>Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button className="px-3 h-9 rounded-lg bg-surface border border-outline/40 text-sm" onClick={() => setEditing(null)}>Cancel</button>
              <button className="px-3 h-9 rounded-lg bg-[#342b63] text-white text-sm" onClick={onSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}