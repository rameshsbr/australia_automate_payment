"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DatePreset, EditColumns, FilterChip } from "@/components/payments-common";
import { Popover } from "@/components/ui";
import NewPaymentMenu from "@/components/payments/new-payment-menu";

export default function BatchPaymentsList() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initialDate = useMemo(() => searchParams.get("date") ?? "", [searchParams]);
  const initialRef = useMemo(() => searchParams.get("ref") ?? "", [searchParams]);

  const [date, setDate] = useState<string>(initialDate);
  const [ref, setRef] = useState<string>(initialRef);

  const [columns, setColumns] = useState({
    submitted: true,
    filename: true,
    type: true,
    status: true,
    debit: true,
    credit: true,
    reference: false,
  });

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

  function applyRef() {
    setParam("ref", ref || "");
  }

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Batch payments</h1>

      {/* toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70"
          placeholder="Search batch payments..."
          aria-label="Search batch payments"
        />

        {/* Date */}
        <DatePreset value={date} onChange={onDateChange} label="Date" />

        {/* Reference */}
        <Popover
          button={({ open }) => (
            <FilterChip>
              <span>Reference</span>
              <span className="text-subt">{ref || ""}</span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
          className="w-[320px]"
        >
          <div className="text-sm space-y-2">
            <div className="text-subt">Filter by Reference</div>
            <input
              className="w-full bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="is equal to"
            />
            <button
              onClick={applyRef}
              className="mt-1 w-full bg-[#6d44c9] rounded h-8 text-sm"
            >
              Apply
            </button>
          </div>
        </Popover>

        <div className="ml-auto flex items-center gap-2">
          <EditColumns columns={columns} setColumns={setColumns} />
          <button className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">
            ⬇️ Export
          </button>
          <NewPaymentMenu />
        </div>
      </div>

      {/* empty state */}
      <div className="bg-panel rounded-xl2 border border-outline/40 p-8 text-center text-subt">
        <div className="py-16">
          <div className="text-2xl mb-2">☰</div>
          <div className="font-medium text-white">No batch payments found</div>
          <div className="text-sm mt-1">
            Try changing the filters or create a new batch payment.
          </div>
          <button
            onClick={() => router.push("/payments/batch/new")}
            className="mt-4 inline-flex items-center gap-2 text-sm bg-surface border border-outline/40 rounded-lg px-4 py-2 hover:bg-surface/70"
          >
            + New batch payment
          </button>
        </div>
      </div>
    </>
  );
}
