"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/chrome";
import DateRangePicker from "@/components/reports/date-range";

export default function RtgsImtReport() {
  return (
    <AppShell>
      <Link href="/reports" className="text-sm text-subt hover:text-white">
        ← Reports
      </Link>
      <ReportForm
        title="RTGS/IMT receivables report"
        subtitle="A daily report of all payments received via real-time gross settlement and international money transfers (SWIFT)"
      />
    </AppShell>
  );
}

function ReportForm({ title, subtitle }: { title: string; subtitle: string }) {
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  function download() {}
  return (
    <>
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-subt mb-6">{subtitle}</p>
      <div className="bg-panel rounded-xl2 border border-outline/40 p-6 w-full max-w-xl">
        <div className="mb-4">
          <div className="text-sm mb-1">From</div>
          <div className="bg-panel border border-outline/40 rounded-lg px-3 h-10 flex items-center text-subt">
            <span className="italic">Select account (coming soon)</span>
          </div>
        </div>
        <div className="mb-6">
          <div className="text-sm mb-1">Date range</div>
          <DateRangePicker value={range} onChange={setRange} label="" />
        </div>
        <div className="flex items-center gap-3">
          <Link href="/reports" className="bg-panel border border-outline/40 rounded-lg px-4 h-10 inline-flex items-center">
            Cancel
          </Link>
          <button onClick={download} className="bg-[#6d44c9] rounded-lg px-4 h-10 inline-flex items-center gap-2">
            ⬇️ Download
          </button>
        </div>
      </div>
    </>
  );
}
