"use client";

import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/date-range";
import { cn } from "@/components/ui";

type ApiResult = any;

export default function TransactionsPage() {
  const [active, setActive] = useState<"uid" | "date" | "uncleared">("uid");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>

      <div className="flex gap-2">
        <TabButton onClick={() => setActive("uid")} active={active === "uid"}>
          Lookup by Unique Reference
        </TabButton>
        <TabButton onClick={() => setActive("date")} active={active === "date"}>
          Status by Date
        </TabButton>
        <TabButton onClick={() => setActive("uncleared")} active={active === "uncleared"}>
          Uncleared by Date
        </TabButton>
      </div>

      {active === "uid" && <StatusByUid />}
      {active === "date" && <StatusByDate />}
      {active === "uncleared" && <UnclearedByDate />}
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-md border text-sm",
        active ? "bg-black text-white" : "bg-white"
      )}
    >
      {children}
    </button>
  );
}

function StatusByUid() {
  const [uid, setUid] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function go() {
    if (!uid.trim()) return;
    setLoading(true);
    setResult(null);
    const r = await fetch(
      `/api/internal/transactions/status-by-uid?uid=${encodeURIComponent(uid)}`,
      { cache: "no-store" }
    );
    const j = await r.json();
    setResult(j);
    setLoading(false);
  }

  return (
    <section className="space-y-3">
      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 w-[420px]"
          placeholder="Enter uniqueReference / callerUniqueReference"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
        />
        <button
          onClick={go}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Loading…" : "Lookup"}
        </button>
      </div>
      <JsonPanel data={result} />
    </section>
  );
}

function StatusByDate() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function go() {
    if (!range?.from) return;
    setLoading(true);
    setResult(null);

    const params = new URLSearchParams();
    if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
      params.set("from", format(range.from, "yyyy-MM-dd"));
      params.set("to", format(range.to, "yyyy-MM-dd"));
    } else {
      params.set("date", format(range.from, "yyyy-MM-dd"));
    }
    params.set("pageNumber", String(pageNumber));
    params.set("pageSize", String(pageSize));

    const r = await fetch(
      `/api/internal/transactions/status-by-date?${params.toString()}`,
      { cache: "no-store" }
    );
    const j = await r.json();
    setResult(j);
    setLoading(false);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker value={range} onChange={setRange} />
        <label className="flex items-center gap-2 text-sm">
          Page
          <input
            type="number"
            className="border rounded px-3 py-2 w-28"
            value={pageNumber}
            onChange={(e) => setPageNumber(Number(e.target.value || 1))}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          Page size
          <input
            type="number"
            className="border rounded px-3 py-2 w-28"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value || 100))}
          />
        </label>
        <button
          onClick={go}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Loading…" : "Fetch"}
        </button>
      </div>
      <JsonPanel data={result} />
    </section>
  );
}

function UnclearedByDate() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function go() {
    if (!range?.from) return;
    setLoading(true);
    setResult(null);
    const params = new URLSearchParams();
    if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
      params.set("from", format(range.from, "yyyy-MM-dd"));
      params.set("to", format(range.to, "yyyy-MM-dd"));
    } else {
      params.set("date", format(range.from, "yyyy-MM-dd"));
    }
    const r = await fetch(
      `/api/internal/transactions/uncleared-by-date?${params.toString()}`,
      { cache: "no-store" }
    );
    const j = await r.json();
    setResult(j);
    setLoading(false);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <DateRangePicker value={range} onChange={setRange} />
        <button
          onClick={go}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Loading…" : "Fetch"}
        </button>
      </div>
      <JsonPanel data={result} />
    </section>
  );
}

function JsonPanel({ data }: { data: any }) {
  if (!data) return null;
  return (
    <pre className="bg-neutral-50 border rounded p-3 text-xs overflow-auto max-h-[60vh]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
