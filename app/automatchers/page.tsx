"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/chrome";
import { DatePreset, EditColumns, FilterChip } from "@/components/payments-common";
import { Popover } from "@/components/ui";

const STATUS_OPTIONS = ["Active", "Inactive"] as const;
const BSB_OPTIONS = ["802-985"];

type ColumnState = {
  bsb: boolean;
  accountNumber: boolean;
  accountName: boolean;
  clientUniqueId: boolean;
  created: boolean;
  status: boolean;
  actions: boolean;
};

type ColumnConfig = {
  key: keyof ColumnState | "select";
  label: string;
  width: string;
  always?: boolean;
};

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: "select", label: "", width: "24px", always: true },
  { key: "bsb", label: "BSB", width: "120px" },
  { key: "accountNumber", label: "Account number", width: "160px" },
  { key: "accountName", label: "Account name", width: "1fr" },
  { key: "clientUniqueId", label: "Client unique ID", width: "1fr" },
  { key: "created", label: "Created", width: "160px" },
  { key: "status", label: "Status", width: "120px" },
  { key: "actions", label: "", width: "32px" }
];

export default function AutomatchersPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initial = useMemo(
    () => ({
      q: searchParams.get("q") ?? "",
      status: searchParams.get("status") ?? "",
      accountNumber: searchParams.get("accountNumber") ?? "",
      bsb: searchParams.get("bsb") ?? "",
      clientId: searchParams.get("clientId") ?? "",
      accountName: searchParams.get("accountName") ?? "",
      date: searchParams.get("date") ?? "Last 7 days",
    }),
    [searchParams]
  );

  const [query, setQuery] = useState(initial.q);
  const [status, setStatus] = useState(initial.status);
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber);
  const [bsb, setBsb] = useState(initial.bsb);
  const [clientId, setClientId] = useState(initial.clientId);
  const [accountName, setAccountName] = useState(initial.accountName);
  const [date, setDate] = useState(initial.date);
  const [columns, setColumns] = useState<ColumnState>({
    bsb: true,
    accountNumber: true,
    accountName: true,
    clientUniqueId: true,
    created: true,
    status: true,
    actions: true,
  });

  const visibleColumns = COLUMN_CONFIG.filter((c) => c.always || columns[c.key as keyof ColumnState]);

  function setParam(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.length) params.set(key, value);
    else params.delete(key);
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  const applyStatus = () => setParam("status", status);
  const applyAccountNumber = () => setParam("accountNumber", accountNumber);
  const applyBsb = () => setParam("bsb", bsb);
  const applyClientId = () => setParam("clientId", clientId);
  const applyAccountName = () => setParam("accountName", accountName);
  const onDateChange = (v: string) => {
    setDate(v);
    setParam("date", v);
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("q", query);
  };

  const rows: any[] = [];

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-semibold">Automatchers</h1>
        <div className="flex items-center gap-2">
          <EditColumns columns={columns} setColumns={setColumns} />
          <button className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">
            ⬇️ Export
          </button>
          <Link
            href="/automatchers/new"
            className="inline-flex items-center gap-2 bg-[#6d44c9] rounded-lg px-3 h-9 text-sm"
          >
            + New automatcher
          </Link>
        </div>
      </div>

      <form onSubmit={onSearchSubmit} className="flex items-center gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70 focus:outline-none"
          placeholder="Search automatchers..."
        />
        <button type="submit" className="hidden" aria-hidden />
      </form>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Popover
          className="w-[220px]"
          button={({ open }) => (
            <FilterChip>
              <span>Status</span>
              <span className="text-subt">{status}</span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
        >
          <div className="text-sm space-y-1">
            <div className="text-subt">Filter by Status</div>
            {STATUS_OPTIONS.map((s) => (
              <label key={s} className="flex items-center gap-2">
                <input type="radio" name="status" checked={status === s} onChange={() => setStatus(s)} />
                <span>{s}</span>
              </label>
            ))}
            <button
              type="button"
              className="mt-2 w-full bg-[#6d44c9] rounded h-8 text-sm"
              onClick={applyStatus}
            >
              Apply
            </button>
          </div>
        </Popover>

        <Popover
          className="w-[280px]"
          button={() => (
            <FilterChip>
              <span>Account number</span>
            </FilterChip>
          )}
        >
          <div className="text-sm space-y-2">
            <div className="text-subt">is equal to</div>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full h-8 px-2 rounded bg-panel border border-outline/40 text-sm"
            />
            <button
              type="button"
              className="w-full bg-[#6d44c9] rounded h-8 text-sm"
              onClick={applyAccountNumber}
            >
              Apply
            </button>
          </div>
        </Popover>

        <Popover
          className="w-[240px]"
          button={({ open }) => (
            <FilterChip>
              <span>BSB</span>
              <span className="text-subt">{bsb}</span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
        >
          <div className="text-sm space-y-1">
            <div className="text-subt">Filter by BSB</div>
            {BSB_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input type="radio" name="bsb" checked={bsb === opt} onChange={() => setBsb(opt)} />
                <span>{opt}</span>
              </label>
            ))}
            <button type="button" className="mt-2 w-full bg-[#6d44c9] rounded h-8 text-sm" onClick={applyBsb}>
              Apply
            </button>
          </div>
        </Popover>

        <Popover
          className="w-[320px]"
          button={() => (
            <FilterChip>
              <span>Client unique ID</span>
            </FilterChip>
          )}
        >
          <div className="text-sm space-y-2">
            <div className="text-subt">is equal to</div>
            <input
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full h-8 px-2 rounded bg-panel border border-outline/40 text-sm"
            />
            <button type="button" className="w-full bg-[#6d44c9] rounded h-8 text-sm" onClick={applyClientId}>
              Apply
            </button>
          </div>
        </Popover>

        <Popover
          className="w-[320px]"
          button={() => (
            <FilterChip>
              <span>Account name</span>
            </FilterChip>
          )}
        >
          <div className="text-sm space-y-2">
            <div className="text-subt">is equal to</div>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full h-8 px-2 rounded bg-panel border border-outline/40 text-sm"
            />
            <button type="button" className="w-full bg-[#6d44c9] rounded h-8 text-sm" onClick={applyAccountName}>
              Apply
            </button>
          </div>
        </Popover>

        <DatePreset label="Date created" value={date} onChange={onDateChange} />
      </div>

      <div className="bg-panel rounded-xl2 border border-outline/40 overflow-hidden">
        <div
          className="grid text-xs uppercase tracking-wide text-subt border-b border-outline/40"
          style={{ gridTemplateColumns: visibleColumns.map((c) => c.width).join(" ") }}
        >
          {visibleColumns.map((col) => (
            <div key={col.key} className="px-3 py-3">
              {col.key === "select" ? <input type="checkbox" aria-label="select all" /> : col.label}
            </div>
          ))}
        </div>

        {rows.length === 0 && (
          <div className="p-12 text-center text-subt">
            <div className="text-sm">No automatchers found</div>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-subt">Showing 0–0 of 0</div>
    </AppShell>
  );
}
