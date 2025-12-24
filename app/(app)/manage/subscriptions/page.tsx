// app/(app)/manage/subscriptions/page.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Env = "sandbox" | "live";
type Service = "notification" | "legacy";

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

function mapEventToService(eventName: string): Service {
  if ((NOTIFICATION_EVENTS as readonly string[]).includes(eventName as any)) return "notification";
  if ((LEGACY_EVENTS as readonly string[]).includes(eventName as any)) return "legacy";
  return "legacy";
}

function useWebhookHint() {
  if (typeof window === "undefined") return "";
  const fromEnv = process.env.NEXT_PUBLIC_WEBHOOK_HINT_BASE_URL?.trim();
  const base = fromEnv || window.location.origin;
  return `${base.replace(/\/$/, "")}/api/webhooks/provider`;
}

// Minimal toast
type Toast = { id: number; type: "error" | "success" | "info"; text: string };
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);
  const push = (t: Omit<Toast, "id">) => {
    const id = idRef.current++;
    setToasts((x) => [...x, { ...t, id }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 4500);
  };
  return { toasts, push };
}

export default function SubscriptionsPage() {
  const [env, setEnv] = useState<Env>("sandbox");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [reportDate, setReportDate] = useState<string>("");
  const [reportCount, setReportCount] = useState<number | null>(null);
  const { toasts, push } = useToasts();

  const recommendedCallback = useWebhookHint();

  async function reload(serviceForList: Service) {
    setLoading(true);
    try {
      const res = await fetch(`/api/manage/subscriptions?service=${serviceForList}&env=${env}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setRows(data.rows ?? []);
    } catch (e: any) {
      push({ type: "error", text: `Load failed: ${e?.message || e}` });
    } finally {
      setLoading(false);
    }
  }

  // default list NM first
  useEffect(() => {
    reload("notification");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env]);

  function onEdit(r?: Row) {
    const eventName = r?.eventName ?? NOTIFICATION_EVENTS[0];
    const service = mapEventToService(eventName);
    setEditing(
      r ?? {
        service,
        subscriptionId: "",
        subscriptionName: "",
        eventName,
        callbackUrl: recommendedCallback,
        isActive: true,
      }
    );
  }

  async function onSave() {
    if (!editing) return;
    const service = mapEventToService(editing.eventName);
    const isNew = !editing.subscriptionId;
    try {
      const qs = `env=${env}${!isNew ? `&id=${encodeURIComponent(editing.subscriptionId)}` : ""}`;
      const method = isNew ? "POST" : ("PUT" as const);
      const body = {
        subscriptionName: editing.subscriptionName || editing.eventName,
        eventName: editing.eventName,
        callbackUrl: editing.callbackUrl,
        isActive: service === "notification" ? editing.isActive : undefined,
      };
      const res = await fetch(`/api/manage/subscriptions?${qs}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setEditing(null);
      push({ type: "success", text: `Subscription ${isNew ? "created" : "updated"}` });
      await reload(service);
    } catch (e: any) {
      push({ type: "error", text: `Save failed: ${e?.message || e}` });
    }
  }

  async function onDelete(r: Row) {
    try {
      const qs = `env=${env}&id=${encodeURIComponent(r.subscriptionId)}`;
      const res = await fetch(`/api/manage/subscriptions?${qs}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || res.statusText);
      }
      push({ type: "success", text: "Deleted" });
      await reload(r.service);
    } catch (e: any) {
      push({ type: "error", text: `Delete failed: ${e?.message || e}` });
    }
  }

  async function onResend(r: Row) {
    if (r.service !== "legacy") return;
    try {
      const qs = `env=${env}&action=resend&id=${encodeURIComponent(r.subscriptionId)}`;
      const res = await fetch(`/api/manage/subscriptions?${qs}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || res.statusText);
      push({ type: "success", text: "Resend requested" });
    } catch (e: any) {
      push({ type: "error", text: `Resend failed: ${e?.message || e}` });
    }
  }

  // Debounced report fetch (Legacy only)
  useEffect(() => {
    if (!reportDate) return;
    const h = setTimeout(async () => {
      try {
        const qs = `env=${env}&action=report&date=${encodeURIComponent(reportDate)}`;
        const res = await fetch(`/api/manage/subscriptions?${qs}`, { method: "GET" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || res.statusText);
        const count = Array.isArray(data?.eventname) ? data.eventname.length : (data?.count ?? 0);
        setReportCount(count);
      } catch (e: any) {
        setReportCount(null);
        push({ type: "error", text: `Report failed: ${e?.message || e}` });
      }
    }, 600);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportDate, env]);

  return (
    <div className="space-y-4">
      {/* Toasts */}
      <div className="fixed right-4 top-14 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id}
               className={`px-3 py-2 rounded-lg text-sm border ${
                 t.type === "error" ? "bg-[#2b1f2f] border-red-500/40 text-red-200"
                 : t.type === "success" ? "bg-[#1f2b23] border-emerald-500/40 text-emerald-200"
                 : "bg-panel border-outline/40 text-subt"
               }`}>
            {t.text}
          </div>
        ))}
      </div>

      {/* Header / controls */}
      <div className="flex items-center justify-between bg-panel border border-outline/40 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-medium">Manage → Subscriptions</h1>
          <span className="text-xs text-subt">Create, update, delete, resend (Legacy), report (Legacy).</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-subt">Env</label>
          <select
            className="bg-surface border border-outline/40 rounded px-2 py-1 text-sm"
            value={env}
            onChange={(e) => setEnv(e.target.value as Env)}
          >
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>

          <button
            onClick={() => onEdit()}
            className="ml-3 px-3 h-8 rounded-lg bg-surface border border-outline/40 text-sm hover:bg-panel/60"
          >
            New
          </button>
        </div>
      </div>

      {/* Callback hint + report */}
      <div className="flex items-center gap-4">
        <div className="text-xs text-subt">
          Callback hint: <code className="bg-panel rounded px-1 py-[2px] border border-outline/30">
            {recommendedCallback || "/api/webhooks/provider"}
          </code> (use your ngrok URL in dev)
        </div>

        <div className="ml-auto flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 py-2">
          <div className="text-sm">Legacy report date:</div>
          <input
            type="date"
            className="bg-surface border border-outline/40 rounded px-2 py-1 text-sm"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />
          <div className="text-xs text-subt">{reportCount != null ? `Items: ${reportCount}` : ""}</div>
        </div>
      </div>

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
                onChange={(e) => {
                  const en = e.target.value;
                  setEditing({ ...editing, eventName: en, service: mapEventToService(en) });
                }}
              >
                <optgroup label="Notification Management">
                  {(NOTIFICATION_EVENTS as readonly string[]).map((e) => <option key={e} value={e}>{e}</option>)}
                </optgroup>
                <optgroup label="Legacy">
                  {(LEGACY_EVENTS as readonly string[]).map((e) => <option key={e} value={e}>{e}</option>)}
                </optgroup>
              </select>

              <div className="text-xs text-subt">Service: <span className="text-white">{mapEventToService(editing.eventName)}</span></div>

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
                  disabled={mapEventToService(editing.eventName) === "legacy"} // legacy doesn't support isActive in request
                />
                <span>Active (Notification Management only)</span>
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