// app/(app)/developer/audit-logs/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DateRangePicker from "@/components/developer/DateRangePicker";
import { EditColumns, FilterChip } from "@/components/payments-common";
import { Popover } from "@/components/ui";

type TLRow = {
  path: string;
  httpStatus: number;
  kind: string;
  _count: { _all: number };
  _avg?: { httpStatus: number | null };
};

type WHRow = {
  kind: string;
  verified: boolean;
  _count: { _all: number };
};

type ApiResp = {
  transactions: TLRow[];
  webhooks: WHRow[];
};

type Col =
  | "date" // kept for column editor demo; not used in grouped table
  | "txnId"
  | "createdBy"
  | "type"
  | "amount"
  | "url"
  | "status"
  | "reviewedBy"
  | "reference"
  | "recipient";

export default function AuditLogs() {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // column editor kept (non-blocking)
  const [cols, setCols] = useState<Record<Col, boolean>>({
    date: true,
    txnId: true,
    createdBy: true,
    type: true,
    amount: true,
    url: false,
    status: false,
    reviewedBy: false,
    reference: false,
    recipient: false,
  });

  const dateValue = useMemo(() => {
    const from = search.get("from") ?? "";
    const to = search.get("to") ?? "";
    const start = search.get("start") ?? "00:00:00";
    const end = search.get("end") ?? "23:59:59";
    return from && to ? { from, to, startTime: start, endTime: end } : undefined;
  }, [search]);

  function setParam(key: string, value?: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onApplyDate(value: any) {
    setParam("from", value?.from);
    setParam("to", value?.to);
    setParam("start", value?.startTime);
    setParam("end", value?.endTime);
  }

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResp | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateValue?.from) params.set("from", dateValue.from);
      if (dateValue?.to) params.set("to", dateValue.to);
      const r = await fetch(`/api/dev/audit-logs?${params.toString()}`, { cache: "no-store" });
      const j = (await r.json()) as ApiResp | { error?: string };
      if (!r.ok) throw new Error((j as any).error || r.statusText);
      setData(j as ApiResp);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateValue?.from, dateValue?.to]);

  function exportCSV() {
    if (!data) return;
    const lines: string[] = [];

    // section 1
    lines.push("API calls (path,status,kind,count,avgStatus)");
    lines.push("path,status,kind,count,avgStatus");
    (data.transactions || []).forEach((r) => {
      lines.push(
        [
          JSON.stringify(r.path ?? ""),
          r.httpStatus ?? "",
          JSON.stringify(r.kind ?? ""),
          r._count?._all ?? 0,
          r._avg?.httpStatus ?? "",
        ].join(",")
      );
    });

    lines.push(""); // spacer

    // section 2
    lines.push("Webhooks (kind,verified,count)");
    lines.push("kind,verified,count");
    (data.webhooks || []).forEach((r) => {
      lines.push([JSON.stringify(r.kind ?? ""), r.verified ? "true" : "false", r._count?._all ?? 0].join(","));
    });

    const blob = new Blob([lines.join("\n") + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredTx = (data?.transactions ?? []).filter((r) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return (
      String(r.path).toLowerCase().includes(t) ||
      String(r.httpStatus).includes(t) ||
      String(r.kind).toLowerCase().includes(t)
    );
  });

  const filteredWh = (data?.webhooks ?? []).filter((r) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return String(r.kind).toLowerCase().includes(t) || String(r.verified).toLowerCase().includes(t);
  });

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <input
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm"
          placeholder="Search audit logs…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <DateRangePicker value={dateValue} onApply={onApplyDate} />

        <Popover
          button={({ open }) => (
            <FilterChip>
              <span>+ Add filter</span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
        >
          <div className="text-sm space-y-1">
            <div className="px-2 py-1 rounded hover:bg-panel/60">Path</div>
            <div className="px-2 py-1 rounded hover:bg-panel/60">Status</div>
            <div className="px-2 py-1 rounded hover:bg-panel/60">Webhook kind</div>
          </div>
        </Popover>

        <button
          onClick={exportCSV}
          className="inline-flex items-center bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm"
          disabled={!data || busy}
        >
          ⬇️ Export
        </button>

        <EditColumns columns={cols} setColumns={setCols} />
      </div>

      {error ? (
        <div className="bg-panel border border-outline/40 rounded-xl2 p-4 text-rose-400 text-sm">{error}</div>
      ) : null}

      {/* API calls table */}
      <div className="border border-outline/40 rounded-lg overflow-hidden mb-6">
        <div className="px-3 py-2 text-sm text-subt border-b border-outline/40">API calls</div>
        <table className="w-full text-sm">
          <thead className="bg-surface/60">
            <tr className="text-subt">
              <th className="text-left p-2">Path</th>
              <th className="text-left p-2 w-28">Status</th>
              <th className="text-left p-2 w-40">Kind</th>
              <th className="text-left p-2 w-24">Count</th>
              <th className="text-left p-2 w-28">Avg</th>
            </tr>
          </thead>
          <tbody>
            {busy ? (
              <tr><td className="p-3" colSpan={5}>Loading…</td></tr>
            ) : filteredTx.length === 0 ? (
              <tr><td className="p-3" colSpan={5}>No rows</td></tr>
            ) : (
              filteredTx.map((r, i) => (
                <tr key={i} className="border-t border-outline/30">
                  <td className="p-2">{r.path}</td>
                  <td className="p-2">{r.httpStatus}</td>
                  <td className="p-2">{r.kind}</td>
                  <td className="p-2">{r._count?._all ?? 0}</td>
                  <td className="p-2">{r._avg?.httpStatus ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Webhooks table */}
      <div className="border border-outline/40 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-sm text-subt border-b border-outline/40">Webhooks</div>
        <table className="w-full text-sm">
          <thead className="bg-surface/60">
            <tr className="text-subt">
              <th className="text-left p-2">Kind</th>
              <th className="text-left p-2 w-24">Verified</th>
              <th className="text-left p-2 w-24">Count</th>
            </tr>
          </thead>
          <tbody>
            {busy ? (
              <tr><td className="p-3" colSpan={3}>Loading…</td></tr>
            ) : filteredWh.length === 0 ? (
              <tr><td className="p-3" colSpan={3}>No rows</td></tr>
            ) : (
              filteredWh.map((r, i) => (
                <tr key={i} className="border-t border-outline/30">
                  <td className="p-2">{r.kind}</td>
                  <td className="p-2">{r.verified ? "yes" : "no"}</td>
                  <td className="p-2">{r._count?._all ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}