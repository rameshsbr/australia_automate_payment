"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DatePreset, FilterChip } from "@/components/payments-common";
import { Popover } from "@/components/ui";

// matches the UI labels in your screenshots
const TYPE_OPTIONS = [
  "Daily Statements",
  "Full Monthly Financial Statements and Tax Invoices",
];

export default function StatementsPage() {
  // read once from URL, then keep UI/URL in sync (so refreshes/bookmarks keep state)
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initialDate = useMemo(
    () => searchParams.get("date") ?? "2025-11-14 to 2025-12-14",
    [searchParams]
  );
  const initialType = useMemo(
    () => searchParams.get("type") ?? "",
    [searchParams]
  );

  const [date, setDate] = useState<string>(initialDate);
  const [type, setType] = useState<string | undefined>(
    initialType || undefined
  );

  // util: set/remove a single query param and keep everything else
  function setParam(key: string, value?: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value.length) p.set(key, value);
    else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function onDateChange(next: string) {
    setDate(next);
    setParam("date", next);
  }

  function applyType() {
    setParam("type", type || "");
  }

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Statements</h1>

      {/* toolbar (search + chips, aligned like your screenshots) */}
      <div className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70"
          placeholder="Search..."
          aria-label="Search statements"
        />

        {/* Date chip shows the current range; DatePreset provides the calendar popover */}
        <DatePreset value={date} onChange={onDateChange} label="Date" />

        {/* Type filter behaves like your popover with Apply */}
        <Popover
          button={({ open }) => (
            <FilterChip>
              <span>Type</span>
              <span className="text-subt">
                {type ?? ""}
              </span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
          className="w-[380px]"
          align="end"
        >
          <div className="text-sm space-y-1">
            {TYPE_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="statement-type"
                  checked={type === opt}
                  onChange={() => setType(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
            <button
              onClick={applyType}
              className="mt-2 w-full bg-[#6d44c9] rounded h-8 text-sm"
            >
              Apply
            </button>
          </div>
        </Popover>
      </div>

      {/* empty state (centered card) */}
      <div className="bg-panel rounded-xl2 border border-outline/40 p-8 text-center text-subt">
        <div className="py-16">
          <div className="text-2xl mb-2">🧾</div>
          <div className="font-medium text-white">No statements yet</div>
          <div className="text-sm mt-1">
            Statements will appear here once they are generated.
          </div>
        </div>
      </div>

      {/* footer line like “Showing 0 – 0 of 0” */}
      <div className="mt-2 text-xs text-subt">Showing 0 – 0 of 0</div>
    </>
  );
}