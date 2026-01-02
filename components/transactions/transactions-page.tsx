"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import NewPaymentMenu from "@/components/payments/new-payment-menu";
import { FilterChip } from "@/components/payments-common";
import { Popover, cn, Toggle } from "@/components/ui";
import { MOCK_TRANSACTIONS, type TransactionRow } from "./mock-data";

type DatePreset =
  | "Today"
  | "Yesterday"
  | "Last 7 days"
  | "Last Week"
  | "This Month"
  | "Last Month"
  | "Custom";

type DateFilterValue = { from: Date; to: Date; preset: DatePreset };

type ColumnKey =
  | "date"
  | "description"
  | "debit"
  | "credit"
  | "balance"
  | "reference"
  | "transactionId"
  | "identifier";

const COLUMN_DEFS: { key: ColumnKey; label: string; align?: "left" | "right" }[] = [
  { key: "date", label: "Date" },
  { key: "description", label: "Description" },
  { key: "debit", label: "Debit", align: "right" },
  { key: "credit", label: "Credit", align: "right" },
  { key: "balance", label: "Balance", align: "right" },
  { key: "reference", label: "Reference" },
  { key: "transactionId", label: "Transaction ID" },
  { key: "identifier", label: "Identifier" }
];

const TYPE_OPTIONS = [
  "Direct Debit",
  "Direct Credit",
  "NPP Direct Credit",
  "BPay Out",
  "NPP Receivable",
  "DE Receivable",
  "DE Direct Debit",
  "BPay Receivable"
];

const STORAGE_KEY = "transactions.columns";
const chipClass =
  "inline-flex items-center gap-2 bg-panel/90 border border-outline/50 rounded-full px-3 h-9 text-sm cursor-pointer select-none";

// --- helpers ---
function getEnvFromCookie(): "sandbox" | "live" {
  if (typeof document === "undefined") return "sandbox";
  const m = document.cookie.match(/(?:^|;\s*)env=([^;]+)/i);
  const v = (m?.[1] ?? "SANDBOX").toUpperCase();
  return v === "LIVE" ? "live" : "sandbox";
}
function parseYmd(v: string | null): Date | null {
  if (!v) return null;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function TransactionsExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // derive initial range from URL (or default to last 7 days)
  const initialRange: DateFilterValue = useMemo(() => {
    const urlFrom = parseYmd(searchParams.get("from"));
    const urlTo = parseYmd(searchParams.get("to"));
    if (urlFrom && urlTo) return { from: urlFrom, to: urlTo, preset: "Custom" };
    return { ...getPresetRange("Last 7 days"), preset: "Last 7 days" };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // compute once on first render

  const [transactions, setTransactions] = useState<TransactionRow[]>(MOCK_TRANSACTIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // search/filter UI state
  const [searchText, setSearchText] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(TYPE_OPTIONS);
  const [referenceFilter, setReferenceFilter] = useState("");
  const [transactionIdFilter, setTransactionIdFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState<{ min?: number; max?: number }>({});
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(initialRange);
  const [columns, setColumns] = useState<Record<ColumnKey, boolean>>({
    date: true,
    description: true,
    debit: true,
    credit: true,
    balance: true,
    reference: true,
    transactionId: true,
    identifier: false
  });

  // current mAccount (optional)
  const mAccount = searchParams.get("m") ?? undefined;

  // persist columns
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved) setColumns((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch {}
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    } catch {}
  }, [columns]);

  // on first mount OR when URL query dates change externally, update range
  useEffect(() => {
    const f = parseYmd(searchParams.get("from"));
    const t = parseYmd(searchParams.get("to"));
    if (f && t) setDateFilter({ from: f, to: t, preset: "Custom" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("from"), searchParams.get("to")]);

  // initial fetch (and refetch when mAccount changes)
  useEffect(() => {
    void fetchTransactions(dateFilter, mAccount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mAccount]);

  const visibleColumns = COLUMN_DEFS.filter((c) => columns[c.key]);

  const filteredTransactions = useMemo(() => {
    const rangeStart = new Date(dateFilter.from);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(dateFilter.to);
    rangeEnd.setHours(23, 59, 59, 999);

    return transactions.filter((tx) => {
      const txDate = new Date(tx.date ?? Date.now());
      if (txDate < rangeStart || txDate > rangeEnd) return false;

      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const haystack = [tx.description, tx.reference, tx.transactionId, tx.identifier]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (selectedTypes.length && selectedTypes.length < TYPE_OPTIONS.length) {
        if (!tx.type || !selectedTypes.includes(tx.type)) return false;
      }

      if (referenceFilter.trim() && !(tx.reference ?? "").toLowerCase().includes(referenceFilter.toLowerCase())) {
        return false;
      }

      if (transactionIdFilter.trim() && !(tx.transactionId ?? "").includes(transactionIdFilter.trim())) {
        return false;
      }

      if (typeof amountFilter.min === "number") {
        const value = tx.credit ?? tx.debit ?? 0;
        if (value < amountFilter.min) return false;
      }
      if (typeof amountFilter.max === "number") {
        const value = tx.credit ?? tx.debit ?? 0;
        if (value > amountFilter.max) return false;
      }

      return true;
    });
  }, [
    amountFilter.max,
    amountFilter.min,
    dateFilter.from,
    dateFilter.to,
    referenceFilter,
    searchText,
    selectedTypes,
    transactionIdFilter,
    transactions
  ]);

  const typeSummary = useMemo(() => {
    if (!selectedTypes.length) return "All types";
    const [first, ...rest] = selectedTypes;
    if (!rest.length) return first;
    return `${first} and ${rest.length} more`;
  }, [selectedTypes]);

  const resetFilters = () => {
    setSearchText("");
    setSelectedTypes(TYPE_OPTIONS);
    setReferenceFilter("");
    setTransactionIdFilter("");
    setAmountFilter({});
    const def = { ...getPresetRange("Last 7 days"), preset: "Last 7 days" as DatePreset };
    setDateFilter(def);
    updateUrlDates(def.from, def.to, { preserveM: true });
    void fetchTransactions(def, mAccount);
  };

  function updateUrlDates(from: Date, to: Date, opts: { preserveM?: boolean } = {}) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", formatDateKey(from));
    params.set("to", formatDateKey(to));
    if (!opts.preserveM) params.delete("m"); // keep as-is unless asked
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function fetchTransactions(range: DateFilterValue, m?: string) {
    try {
      setLoading(true);
      setError(null);

      const env = getEnvFromCookie();
      const fromKey = formatDateKey(range.from);
      const toKey = formatDateKey(range.to);

      let url: string;
      if (m) {
        // new account-scoped endpoint
        url = `/api/monoova/account/${encodeURIComponent(m)}/transactions/${fromKey}/${toKey}?env=${env}`;
      } else {
        // legacy internal endpoint (no mAccount in URL)
        const params = new URLSearchParams({ from: fromKey, to: toKey, pageSize: "200" });
        url = `/api/internal/transactions/status-by-date?${params.toString()}`;
      }

      const res = await fetch(url, { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || `Request failed (${res.status})`);

      const normalized = normalizeTransactions(payload);
      setTransactions(normalized.length ? normalized : MOCK_TRANSACTIONS);
    } catch (err: any) {
      console.error(err);
      setError("Unable to refresh transactions from the API. Showing the latest cached results.");
      setTransactions(MOCK_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Transactions</h1>
          {mAccount ? (
            <span className="text-xs text-subt border border-outline/40 rounded px-2 py-1">
              mAccount: <span className="font-mono">{mAccount}</span>
            </span>
          ) : null}
        </div>
        <NewPaymentMenu />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subt opacity-80">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path
                d="M14.5 14.5L18 18M16 9.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-panel border border-outline/60 rounded-lg h-11 pl-9 pr-3 text-sm placeholder:text-subt/70 focus:outline-none"
            placeholder="Search transactions..."
          />
        </div>

        <ColumnsPopover columns={columns} onToggle={setColumns} />

        <button className="inline-flex items-center gap-2 bg-panel/80 border border-outline/60 rounded-lg px-3 h-11 text-sm">
          <span className="text-lg leading-none">⭳</span>
          <span>Export</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DateFilterChip
          value={dateFilter}
          onChange={(next) => {
            setDateFilter(next);
            updateUrlDates(next.from, next.to, { preserveM: true });
            void fetchTransactions(next, mAccount);
          }}
        />

        <TypeFilterChip
          selected={selectedTypes}
          onChange={setSelectedTypes}
          summary={typeSummary}
          onClear={() => setSelectedTypes([])}
        />

        <ReferenceFilterChip value={referenceFilter} onApply={setReferenceFilter} />
        <AmountFilterChip value={amountFilter} onApply={setAmountFilter} />
        <TransactionIdFilterChip value={transactionIdFilter} onApply={setTransactionIdFilter} />

        <button
          onClick={resetFilters}
          className="ml-auto text-sm text-subt hover:text-text transition underline-offset-4"
        >
          Reset filters
        </button>
      </div>

      <div className="bg-panel rounded-xl2 border border-outline/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3 text-xs text-subt">
          {loading ? <span>Refreshing transactions…</span> : <span>Showing {filteredTransactions.length} results</span>}
          {error ? <span className="text-amber-300">{error}</span> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="text-xs uppercase text-subt tracking-wide">
                {visibleColumns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "font-medium px-4 py-3 border-b border-outline/50",
                      c.align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-subt border-b border-outline/40"
                    colSpan={visibleColumns.length}
                  >
                    No transactions match these filters
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface/40 transition">
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-4 border-b border-outline/30 align-top",
                          col.align === "right" ? "text-right" : "text-left"
                        )}
                      >
                        <CellValue tx={tx} column={col.key} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- cells and filter UI (unchanged aside from searchText rename) ---

function CellValue({ tx, column }: { tx: TransactionRow; column: ColumnKey }) {
  if (column === "date") {
    const { label, tz } = formatSydneyDate(tx.date);
    return (
      <div className="leading-relaxed">
        <div>{label}</div>
        <div className="text-xs text-subt">{tz}</div>
      </div>
    );
  }

  if (column === "description") {
    return <div className="whitespace-pre-line leading-relaxed">{tx.description ?? "—"}</div>;
  }

  if (column === "debit") {
    return <span className="font-medium">{formatCurrency(tx.debit)}</span>;
  }
  if (column === "credit") {
    return <span className="font-medium">{formatCurrency(tx.credit)}</span>;
  }
  if (column === "balance") {
    return <span className="font-semibold">{formatCurrency(tx.balance)}</span>;
  }
  if (column === "reference") {
    return tx.reference ? <Pill>{tx.reference}</Pill> : <span className="text-subt">—</span>;
  }
  if (column === "transactionId") {
    return tx.transactionId ? <Pill>{tx.transactionId}</Pill> : <span className="text-subt">—</span>;
  }
  if (column === "identifier") {
    return tx.identifier ? <Pill>{tx.identifier}</Pill> : <span className="text-subt">—</span>;
  }
  return "—";
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-outline/60 bg-surface px-2 py-1 text-xs font-medium">
      {children}
    </span>
  );
}

function formatCurrency(value?: number) {
  if (value == null) return "—";
  return `$${value.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatSydneyDate(dateStr?: string) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
  const label = formatter.format(date);
  return { label, tz: "(Sydney Time)" };
}

function getPresetRange(preset: DatePreset): { from: Date; to: Date } {
  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  switch (preset) {
    case "Today":
      return { from: startOfToday, to: new Date(startOfToday) };
    case "Yesterday": {
      const y = new Date(startOfToday);
      y.setDate(y.getDate() - 1);
      return { from: y, to: y };
    }
    case "Last 7 days": {
      const from = new Date(startOfToday);
      from.setDate(from.getDate() - 6);
      return { from, to: startOfToday };
    }
    case "Last Week": {
      const end = new Date(startOfToday);
      const day = end.getDay() === 0 ? 7 : end.getDay();
      end.setDate(end.getDate() - day);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      return { from: start, to: end };
    }
    case "This Month": {
      const start = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
      const end = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 0);
      return { from: start, to: end };
    }
    case "Last Month": {
      const start = new Date(startOfToday.getFullYear(), startOfToday.getMonth() - 1, 1);
      const end = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 0);
      return { from: start, to: end };
    }
    default:
      return { from: startOfToday, to: startOfToday };
  }
}

function normalizeTransactions(payload: any): TransactionRow[] {
  const items =
    (Array.isArray(payload?.transactions) && payload.transactions) ||
    (Array.isArray(payload?.report?.items) && payload.report.items) ||
    (Array.isArray(payload) && payload) ||
    [];

  return items.map((item: any, index: number) => {
    const date =
      item?.createdAt ??
      item?.createdOn ??
      item?.date ??
      item?.transactionDate ??
      item?.startDate ??
      item?.endDate ??
      new Date().toISOString();

    const amount = item?.amount ?? item?.value ?? undefined;
    const debit = item?.debit ?? (typeof amount === "number" && amount < 0 ? Math.abs(amount) : undefined);
    const credit = item?.credit ?? (typeof amount === "number" && amount > 0 ? amount : undefined);

    return {
      id: item?.id ?? item?.uniqueReference ?? item?.uniqueReferenceNumber ?? `tx-${index}`,
      date,
      description: item?.description ?? item?.statusDescription ?? item?.status ?? "Transaction",
      debit,
      credit,
      balance: item?.balance ?? item?.availableBalance ?? item?.currentBalance,
      reference: item?.reference ?? item?.uniqueReference ?? item?.uniqueReferenceNumber,
      transactionId: item?.transactionId ?? item?.transactionID ?? item?.id ?? item?.uniqueReference,
      type: item?.paymentSource ?? item?.method ?? item?.type,
      identifier: item?.identifier ?? item?.accountId ?? item?.accountID
    };
  });
}

// ----- Filter chips (unchanged UI) -----

function DateFilterChip({ value, onChange }: { value: DateFilterValue; onChange: (next: DateFilterValue) => void }) {
  const [cursor, setCursor] = useState<Date>(value.to);
  const [preset, setPreset] = useState<DatePreset>(value.preset);
  const [draft, setDraft] = useState<{ from?: Date; to?: Date }>({ from: value.from, to: value.to });

  useEffect(() => {
    setDraft({ from: value.from, to: value.to });
    setCursor(value.to);
    setPreset(value.preset);
  }, [value.from, value.preset, value.to]);

  const monthDays = useMemo(() => {
    const start = startOfCalendar(cursor);
    return Array.from({ length: 42 }).map((_, i) => addDays(start, i));
  }, [cursor]);

  const displayLabel = value.preset === "Custom" ? formatRange(value.from, value.to) : value.preset;

  const apply = (close: () => void) => {
    const from = draft.from ?? value.from;
    const to = draft.to ?? draft.from ?? value.to;
    onChange({ from, to, preset });
    close();
  };

  const pickDay = (date: Date) => {
    setPreset("Custom");
    if (!draft.from || (draft.from && draft.to)) {
      setDraft({ from: date, to: undefined });
      return;
    }

    if (date < draft.from) {
      setDraft({ from: date, to: draft.from });
    } else {
      setDraft({ ...draft, to: date });
    }
  };

  const updatePreset = (next: DatePreset) => {
    const range = getPresetRange(next);
    setPreset(next);
    setDraft(range);
    setCursor(range.to);
  };

  return (
    <Popover
      align="left"
      button={({ open }) => (
        <FilterChip className={cn(chipClass, "min-w-[140px] justify-between")}>
          <span className="flex items-center gap-2">
            <span className="font-semibold">Date</span>
            <span className="text-subt">|</span>
            <span className="text-subt">{displayLabel}</span>
          </span>
          <span className="ml-2 text-xs">{open ? "▴" : "▾"}</span>
        </FilterChip>
      )}
      className="w-[360px]"
    >
      {({ close }) => (
        <div className="text-sm space-y-3">
          <div className="text-base font-semibold">Filter by Date</div>
          <select
            className="w-full bg-panel border border-outline/50 rounded-lg h-10 px-3"
            value={preset}
            onChange={(e) => updatePreset(e.target.value as DatePreset)}
          >
            {["Today", "Yesterday", "Last 7 days", "Last Week", "This Month", "Last Month"].map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <select
              className="flex-1 bg-panel border border-outline/50 rounded-lg h-10 px-2"
              value={cursor.getMonth()}
              onChange={(e) =>
                setCursor(new Date(cursor.getFullYear(), Number(e.target.value), cursor.getDate()))
              }
            >
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December"
              ].map((month, idx) => (
                <option key={month} value={idx}>
                  {month}
                </option>
              ))}
            </select>
            <select
              className="w-24 bg-panel border border-outline/50 rounded-lg h-10 px-2"
              value={cursor.getFullYear()}
              onChange={(e) =>
                setCursor(new Date(Number(e.target.value), cursor.getMonth(), cursor.getDate()))
              }
            >
              {Array.from({ length: 7 }).map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
            <div className="inline-flex gap-1">
              <button
                className="bg-surface rounded-lg px-2 h-10 border border-outline/50"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                ‹
              </button>
              <button
                className="bg-surface rounded-lg px-2 h-10 border border-outline/50"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-xs text-subt gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day) => {
              const inMonth = day.getMonth() === cursor.getMonth();
              const dayValue = startOfDayValue(day);
              const startValue = draft.from ? startOfDayValue(draft.from) : null;
              const endValue = draft.to ? startOfDayValue(draft.to) : null;
              const isStart = startValue !== null && dayValue === startValue;
              const isEnd = endValue !== null && dayValue === endValue;
              const inRange =
                startValue !== null && endValue !== null && dayValue >= startValue && dayValue <= endValue;

              return (
                <button
                  key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                  onClick={() => pickDay(day)}
                  className={cn(
                    "h-10 rounded-full border border-outline/60 flex items-center justify-center text-sm transition",
                    inMonth ? "text-text" : "text-subt/60",
                    inRange ? "bg-[#6d44c9] text-white border-transparent" : "bg-panel",
                    isStart ? "rounded-l-full" : "",
                    isEnd ? "rounded-r-full" : ""
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <button
            className="w-full bg-[#6d44c9] hover:bg-[#5a36a6] rounded-lg h-11 text-sm font-semibold transition"
            onClick={() => apply(close)}
          >
            Apply
          </button>
        </div>
      )}
    </Popover>
  );
}

function TypeFilterChip({
  selected,
  onChange,
  summary,
  onClear
}: {
  selected: string[];
  summary: string;
  onChange: (next: string[]) => void;
  onClear: () => void;
}) {
  const toggle = (option: string) => {
    if (selected.includes(option)) onChange(selected.filter((t) => t !== option));
    else onChange([...selected, option]);
  };

  return (
    <Popover
      button={({ open }) => (
        <FilterChip className={chipClass}>
          <span className="font-semibold">Type</span>
          <span className="text-subt">|</span>
          <span className="text-subt">{summary}</span>
          {selected.length > 0 ? (
            <button
              aria-label="Clear type filter"
              className="ml-1 text-subt hover:text-text"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              ×
            </button>
          ) : null}
          <span className="ml-1 text-xs">{open ? "▴" : "▾"}</span>
        </FilterChip>
      )}
      className="w-[260px]"
    >
      {({ close }) => (
        <div className="text-sm space-y-2">
          <div className="text-base font-semibold">Filter by Type</div>
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {TYPE_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              className="flex-1 bg-[#6d44c9] rounded-lg h-9 text-sm font-semibold"
              onClick={() => close()}
            >
              Apply
            </button>
            <button
              className="px-3 h-9 text-sm rounded-lg border border-outline/60"
              onClick={() => {
                onClear();
                close();
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

function ReferenceFilterChip({ value, onApply }: { value: string; onApply: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <Popover
      button={({ open }) => (
        <FilterChip className={chipClass}>
          <span className="text-lg leading-none">＋</span>
          <span>Reference</span>
          <span className="ml-1 text-xs">{open ? "▴" : "▾"}</span>
        </FilterChip>
      )}
      className="w-[260px]"
    >
      {({ close }) => (
        <div className="space-y-3 text-sm">
          <div className="text-base font-semibold">Reference</div>
          <input
            className="w-full bg-panel border border-outline/60 rounded-lg h-10 px-3"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search reference"
          />
          <button
            className="w-full bg-[#6d44c9] rounded-lg h-10 text-sm font-semibold"
            onClick={() => {
              onApply(draft);
              close();
            }}
          >
            Apply
          </button>
        </div>
      )}
    </Popover>
  );
}

function TransactionIdFilterChip({ value, onApply }: { value: string; onApply: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <Popover
      button={({ open }) => (
        <FilterChip className={chipClass}>
          <span className="text-lg leading-none">＋</span>
          <span>Transaction ID</span>
          <span className="ml-1 text-xs">{open ? "▴" : "▾"}</span>
        </FilterChip>
      )}
      className="w-[260px]"
    >
      {({ close }) => (
        <div className="space-y-3 text-sm">
          <div className="text-base font-semibold">Transaction ID</div>
          <input
            className="w-full bg-panel border border-outline/60 rounded-lg h-10 px-3"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search transaction ID"
          />
          <button
            className="w-full bg-[#6d44c9] rounded-lg h-10 text-sm font-semibold"
            onClick={() => {
              onApply(draft);
              close();
            }}
          >
            Apply
          </button>
        </div>
      )}
    </Popover>
  );
}

function AmountFilterChip({
  value,
  onApply
}: {
  value: { min?: number; max?: number };
  onApply: (next: { min?: number; max?: number }) => void;
}) {
  const [draft, setDraft] = useState<{ min?: number; max?: number }>(value);
  useEffect(() => setDraft(value), [value]);

  const update = (key: "min" | "max", raw: string) => {
    if (raw === "") {
      setDraft((prev) => ({ ...prev, [key]: undefined }));
      return;
    }
    const num = Number(raw);
    setDraft((prev) => ({ ...prev, [key]: Number.isNaN(num) ? prev[key] : num }));
  };

  return (
    <Popover
      button={({ open }) => (
        <FilterChip className={chipClass}>
          <span className="text-lg leading-none">＋</span>
          <span>Amount</span>
          <span className="ml-1 text-xs">{open ? "▴" : "▾"}</span>
        </FilterChip>
      )}
      className="w-[260px]"
    >
      {({ close }) => (
        <div className="space-y-3 text-sm">
          <div className="text-base font-semibold">Amount</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-subt">
              Min
              <input
                className="mt-1 w-full bg-panel border border-outline/60 rounded-lg h-10 px-3"
                value={draft.min ?? ""}
                onChange={(e) => update("min", e.target.value)}
                placeholder="0.00"
              />
            </label>
            <label className="text-xs text-subt">
              Max
              <input
                className="mt-1 w-full bg-panel border border-outline/60 rounded-lg h-10 px-3"
                value={draft.max ?? ""}
                onChange={(e) => update("max", e.target.value)}
                placeholder="1000.00"
              />
            </label>
          </div>
          <button
            className="w-full bg-[#6d44c9] rounded-lg h-10 text-sm font-semibold"
            onClick={() => {
              onApply(draft);
              close();
            }}
          >
            Apply
          </button>
        </div>
      )}
    </Popover>
  );
}

function ColumnsPopover({
  columns,
  onToggle
}: {
  columns: Record<ColumnKey, boolean>;
  onToggle: (next: Record<ColumnKey, boolean>) => void;
}) {
  return (
    <Popover
      align="right"
      button={({ open }) => (
        <button className="inline-flex items-center gap-2 bg-panel/80 border border-outline/60 rounded-lg px-3 h-11 text-sm">
          <span className="text-lg leading-none">⚙️</span>
          <span>Edit columns</span>
          <span className="ml-1 text-xs">{open ? "▴" : "▾"}</span>
        </button>
      )}
      className="w-[260px]"
    >
      <div className="space-y-2 text-sm">
        {COLUMN_DEFS.map((col) => (
          <div key={col.key} className="flex items-center justify-between py-1">
            <div className="inline-flex items-center gap-2">
              <span className="text-subt">⋮⋮</span>
              <span>{col.label}</span>
            </div>
            <Toggle
              checked={!!columns[col.key]}
              onChange={(v) => onToggle({ ...columns, [col.key]: v })}
            />
          </div>
        ))}
      </div>
    </Popover>
  );
}

// --- tiny date utils ---
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function startOfCalendar(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const day = start.getDay() === 0 ? 7 : start.getDay();
  start.setDate(start.getDate() - (day - 1));
  return start;
}
function formatRange(from: Date, to: Date) {
  return `${formatHuman(from)} - ${formatHuman(to)}`;
}
function startOfDayValue(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function formatHuman(date: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}