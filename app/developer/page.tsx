"use client";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-panel border border-outline/40 rounded-xl2 p-4 flex-1">
      <div className="text-sm text-subt mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default function DevOverview() {
  const kpis = useMemo(
    () => [
      { label: "Total API calls", value: 0 },
      { label: "Successes", value: 0 },
      { label: "Errors", value: 0 },
    ],
    []
  );

  const pathname = usePathname();
  const modePrefix = (pathname || "").startsWith("/sandbox") ? "/sandbox" : "";

  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {kpis.map((kpi) => (
          <Kpi key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium opacity-90">API history</div>
        <Link href={`${modePrefix}/developer/api-history`} className="text-sm opacity-80 hover:opacity-100">
          View more →
        </Link>
      </div>

      <div className="bg-panel border border-outline/40 rounded-xl2 p-6 text-center text-subt">
        No recent API calls
      </div>
    </>
  );
}
