"use client";

import Link from "next/link";
import { REPORTS } from "./_defs";

export default function ReportsIndex() {
  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Reports</h1>

      <div className="mb-4">
        <input
          className="w-full bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70"
          placeholder="Search..."
          aria-label="Search reports"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <Link
            key={r.slug}
            href={`/reports/${r.slug}`}
            className="block bg-panel border border-outline/40 rounded-xl2 px-4 py-4 hover:bg-panel/70 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-sm text-subt mt-1">{r.description}</div>
              </div>
              <div aria-hidden>›</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
