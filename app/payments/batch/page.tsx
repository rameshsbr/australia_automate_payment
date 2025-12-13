// file: app/payments/batch/page.tsx
"use client";
import { AppShell } from "@/components/chrome";
import { DatePreset, EditColumns, FilterChip } from "@/components/payments-common";
import { Popover } from "@/components/ui";
import { useState } from "react";

export default function Page() {
  const [date, setDate] = useState("Select date range...");
  const [columns, setColumns] = useState({
    submitted: true,
    reference: true,
    status: true,
    createdBy: true,
    amount: true
  });

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Batch payments</h1>

      <div className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70"
          placeholder="Search batch payments..."
        />

        <DatePreset value={date} onChange={setDate} label="Date" />
        <Popover button={() => <FilterChip>Reference</FilterChip>} />

        <div className="ml-auto flex items-center gap-2">
          <EditColumns columns={columns} setColumns={setColumns} />
          <button className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">
            ⬇️ Export
          </button>
          <button className="inline-flex items-center gap-2 bg-[#6d44c9] rounded-lg px-3 h-9 text-sm">
            + New payment
          </button>
        </div>
      </div>

      <div className="bg-panel rounded-xl2 border border-outline/40 p-8 text-center text-subt">
        <div className="py-16">
          <div className="text-2xl mb-2">🧺</div>
          <div className="font-medium text-white">No batch payments found</div>
          <div className="text-sm mt-1">Try changing the filters or create a new batch payment.</div>
          <button className="mt-4 inline-flex items-center gap-2 text-sm bg-surface border border-outline/40 rounded-lg px-4 py-2 hover:bg-surface/70">
            + New batch payment
          </button>
        </div>
      </div>
    </AppShell>
  );
}