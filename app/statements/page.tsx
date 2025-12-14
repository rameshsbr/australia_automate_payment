// file: app/statements/page.tsx
"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/chrome";
import { FilterChip } from "@/components/payments-common";
import { Popover } from "@/components/ui";

/**
 * Notes
 * - This is UI-only (no DB). It mirrors the Statements screen in your screenshots.
 * - URL params kept in sync for shareable filters: ?date=...&type=...
 */

const TYPE = [
  "Daily Statements",
  "Full Monthly Financial Statements and Tax Invoices",
];

export default function StatementsPage() {
  // url helpers
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // initial state from URL (so refresh preserves filters)
  const initialDateLabel = useMemo(
    () => searchParams.get("date") ?? "2025-11-14 to 2025-12-14",
    [searchParams]
  );
  const initialType = useMemo(
    () => searchParams.get("type") ?? "",
    [searchParams]
  );

  // local state
  const [dateLabel, setDateLabel] = useState<string>(initialDateLabel);
  const [type, setType] = useState<string | undefined>(
    initialType || undefined
  );

  function setParam(key: string, value?: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value.length) p.set(key, value);
    else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function applyDate(next: string) {
    setDateLabel(next);
    setParam("date", next);
  }

  function applyType() {
    setParam("type", type || "");
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Statements</h1>

      {/* toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70"
          placeholder="Search..."
        />

        {/* Date chip with a lightweight 'custom range' popover */}
        <Popover
          button={({ open }) => (
            <FilterChip>
              <span>Date</span>
              <span className="text-subt">{dateLabel}</span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
          className="w-[320px]"
        >
          {/* Mini 'Custom' calendar-style panel to match screenshots (UI only) */}
          <div className="text-sm">
            <div className="mb-2">
              <label className="block text-xs mb-1 text-subt">Filter by Date</label>
              <select
                className="w-full h-8 bg-panel border border-outline/40 rounded px-2 text-sm"
                value="Custom"
                onChange={() => {}}
              >
                <option>Custom</option>
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 days</option>
                <option>Last Week</option>
                <option>This Month</option>
                <option>Last Month</option>
              </select>
            </div>

            {/* Faux range picker grid — just visuals so it looks right now */}
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-2">
                <select className="bg-panel border border-outline/40 rounded h-8 px-2">
                  <option>November</option>
                  <option>December</option>
                  <option>January</option>
                </select>
                <select className="bg-panel border border-outline/40 rounded h-8 px-2">
                  <option>2025</option>
                  <option>2024</option>
                  <option>2023</option>
                </select>
              </div>
              <div className="inline-flex items-center gap-2">
                <button className="bg-panel border border-outline/40 rounded h-8 w-8">‹</button>
                <button className="bg-panel border border-outline/40 rounded h-8 w-8">›</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-subt/80 mb-2">
              <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
            </div>
            {/* Grid placeholders to mimic calendar days */}
            <div className="grid grid-cols-7 gap-1 text-center mb-3">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 leading-8 rounded border border-transparent hover:border-outline/40 hover:bg-panel/60 cursor-default"
                >
                  {/* intentionally blank to keep UI-only feel */}
                </div>
              ))}
            </div>

            <button
              className="w-full bg-[#6d44c9] rounded h-8 text-sm"
              onClick={() => applyDate(dateLabel)}
            >
              Apply
            </button>
          </div>
        </Popover>

        {/* Type chip */}
        <Popover
          button={({ open }) => (
            <FilterChip>
              <span>Type</span>
              <span className="text-subt">{type ?? ""}</span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
          className="w-[340px]"
        >
          <div className="text-sm space-y-1">
            {TYPE.map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="statement-type"
                  checked={type === t}
                  onChange={() => setType(t)}
                />
                <span>{t}</span>
              </label>
            ))}
            <button className="mt-2 w-full bg-[#6d44c9] rounded h-8 text-sm" onClick={applyType}>
              Apply
            </button>
          </div>
        </Popover>
      </div>

      {/* empty state panel */}
      <div className="bg-panel rounded-xl2 border border-outline/40 p-8 text-center text-subt">
        <div className="py-16">
          <div className="text-2xl mb-2">🧾</div>
          <div className="font-medium text-white">No statements yet</div>
          <div className="text-sm mt-1">
            Statements will appear here once they are generated.
          </div>
        </div>
      </div>

      {/* bottom meta line to mirror “Showing 0–0 of 0” feel */}
      <div className="mt-3 text-xs text-subt">Showing 0 – 0 of 0</div>
    </AppShell>
  );
}
