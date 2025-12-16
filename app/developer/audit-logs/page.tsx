"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DateRangePicker from "@/components/developer/DateRangePicker";
import { EditColumns, FilterChip } from "@/components/payments-common";
import { Popover } from "@/components/ui";

type Col =
  | "date"
  | "txnId"
  | "createdBy"
  | "type"
  | "amount"
  | "url"
  | "status"
  | "reviewedBy"
  | "reference"
  | "recipient";

export default function AuditLogs() {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [cols, setCols] = useState<Record<Col, boolean>>({
    date: true,
    txnId: true,
    createdBy: true,
    type: true,
    amount: true,
    url: false,
    status: false,
    reviewedBy: false,
    reference: false,
    recipient: false,
  });

  const dateValue = useMemo(() => {
    const from = search.get("from") ?? "";
    const to = search.get("to") ?? "";
    const start = search.get("start") ?? "00:00:00";
    const end = search.get("end") ?? "23:59:59";
    return from && to ? { from, to, startTime: start, endTime: end } : undefined;
  }, [search]);

  function setParam(key: string, value?: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onApplyDate(value: any) {
    setParam("from", value?.from);
    setParam("to", value?.to);
    setParam("start", value?.startTime);
    setParam("end", value?.endTime);
  }

  function exportCSV() {
    const head = [
      "Date",
      "Transaction ID",
      "Created by",
      "Transaction type",
      "Amount",
      "URL",
      "Status",
      "Reviewed by",
      "Transaction reference",
      "Recipient",
    ];
    const blob = new Blob([head.join(",") + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <input
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm"
          placeholder="Search audit logs..."
        />

        <DateRangePicker value={dateValue} onApply={onApplyDate} />

        <Popover
          button={({ open }) => (
            <FilterChip>
              <span>+ Add filter</span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
        >
          <div className="text-sm space-y-1">
            <div className="px-2 py-1 rounded hover:bg-panel/60">Transaction ID</div>
            <div className="px-2 py-1 rounded hover:bg-panel/60">Created By</div>
          </div>
        </Popover>

        <button
          onClick={exportCSV}
          className="inline-flex items-center bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm"
        >
          ⬇️ Export
        </button>

        <EditColumns columns={cols} setColumns={setCols} />
      </div>

      <div className="bg-panel border border-outline/40 rounded-xl2 p-10 text-center text-subt">
        <div className="text-2xl mb-1">&lt;/&gt;</div>
        <div className="font-medium text-white">No audit logs found</div>
        <div className="text-sm mt-1">Try changing the filters.</div>
      </div>
    </>
  );
}
