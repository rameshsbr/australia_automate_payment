"use client";

import { useMemo, useState } from "react";
import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation";
import { DatePreset } from "@/components/payments-common";
import { getReport } from "../_defs";

type Props = { params: { slug: string } };

function todayISO() {
  const d = new Date();
  const iso = d.toISOString().slice(0, 10);
  return iso; // YYYY-MM-DD
}

export default function ReportPage({ params }: Props) {
  const report = getReport(params.slug);
  if (!report) return notFound();

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // defaults that match screenshots (single date uses today; range uses today–today)
  const defaultSingle = todayISO();
  const defaultRange = `${todayISO()} to ${todayISO()}`;

  const initialDate = useMemo(() => {
    const v = searchParams.get("date");
    if (v) return v;
    return report.dateKind === "single" ? defaultSingle : defaultRange;
  }, [searchParams, report?.dateKind]);

  const [date, setDate] = useState<string>(initialDate);
  const [downloading, setDownloading] = useState(false);

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

  async function onDownload() {
    // Placeholder: wire to your API later.
    setDownloading(true);
    try {
      // e.g. await fetch(`/api/reports/${report.slug}?date=${encodeURIComponent(date)}`)
      console.log("Download requested:", { report: report.slug, date });
      // toast/snackbar can be added here
    } finally {
      setDownloading(false);
    }
  }

  function onCancel() {
    router.push("/reports");
  }

  return (
    <>
      <button
        onClick={() => router.push("/reports")}
        className="text-sm text-subt hover:text-white mb-2"
      >
        ← Reports
      </button>

      <h1 className="text-2xl font-semibold">{report.title}</h1>
      <p className="text-subt mt-2 mb-6 max-w-3xl">{report.description}</p>

      <div className="bg-panel border border-outline/40 rounded-xl2 p-4 max-w-xl">
        {/* From (static display like screenshot) */}
        <label className="block text-sm mb-1">From</label>
        <div className="bg-surface/60 border border-outline/40 rounded-lg h-10 px-3 flex items-center text-sm mb-4">
          UB AdsMedia Pty Ltd Account
          <span className="text-subt ml-2">#6279059743697945</span>
        </div>

        {/* Date / Date range */}
        <label className="block text-sm mb-1">
          {report.dateKind === "single" ? "Date" : "Date range"}
        </label>
        <div className="mb-4">
          <DatePreset
            value={date}
            onChange={onDateChange}
            label={report.dateKind === "single" ? "Date" : "Date range"}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center bg-panel border border-outline/40 rounded-lg h-9 px-4 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onDownload}
            disabled={downloading}
            className="inline-flex items-center justify-center bg-[#6d44c9] rounded-lg h-9 px-4 text-sm disabled:opacity-60"
          >
            ⬇️ Download
          </button>
        </div>
      </div>
    </>
  );
}
