"use client";
import { AppShell } from "@/components/chrome";
import { DatePreset, EditColumns } from "@/components/payments-common";
import { LockPanel } from "@/components/payments-widgets";
import { useState } from "react";

const RTGS_COLUMNS = [
  "Date",
  "Transaction ID",
  "BSB",
  "Account number",
  "Account name",
  "Transaction reference number",
  "Status",
  "Amount",
  "Lodgement reference",
  "Source account details",
  "Respond before date time",
  "Reject reason description",
  "Processed date",
  "Sending organisation",
  "Receiving organisation",
  "Ordering institution",
  "Originating address"
];

export default function Page() {
  const [date, setDate] = useState("Last 7 days");
  const [columns, setColumns] = useState<Record<string, boolean>>(
    Object.fromEntries(RTGS_COLUMNS.map((c, i) => [c, i < 8]))
  );

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">RTGS/IMT transactions</h1>

      <div className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70"
          placeholder="Search RTGS/IMT transactions..."
        />
        <DatePreset value={date} onChange={setDate} />
        <div className="ml-auto flex items-center gap-2">
          <EditColumns columns={columns} setColumns={setColumns} />
          <button className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">
            ⬇️ Export
          </button>
        </div>
      </div>

      <LockPanel
        title="Activate RTGS/IMT transactions"
        message="You do not have permission to use this feature."
        buttonText="Speak with your Relationship Manager to set up RTGS/IMT"
      />
    </AppShell>
  );
}
