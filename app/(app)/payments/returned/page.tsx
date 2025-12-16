// file: app/payments/returned/page.tsx
"use client";
import { DatePreset, EditColumns, FilterChip } from "@/components/payments-common";
import { Popover } from "@/components/ui";
import NewPaymentMenu from "@/components/payments/new-payment-menu";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TYPE = ["Credit","Debit"];
const STATUS = ["Pending","Resolved","Skipped","Retried","Retry Pending Approval","Declined By Approver"];

export default function ReturnedPayments() {
  // WHY: persistent filter state via URL.
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const initialDate   = useMemo(() => searchParams.get("date")   ?? "Last 7 days", [searchParams]);
  const initialType   = useMemo(() => searchParams.get("type")   ?? "", [searchParams]);
  const initialStatus = useMemo(() => searchParams.get("status") ?? "", [searchParams]);

  const [date, setDate] = useState(initialDate);
  const [type, setType] = useState<string|undefined>(initialType || undefined);
  const [status, setStatus] = useState<string|undefined>(initialStatus || undefined);
  const [columns, setColumns] = useState({
    returnDate: true, transactionDate: true, bankAccount: true, type: true, status: true, amount: true,
    returnReason: false, internalReference: false, clientReference: false
  });

  function setParam(key: string, value?: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value.length) p.set(key, value); else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function onDateChange(next: string) { setDate(next); setParam("date", next); }
  function applyType() { setParam("type", type || ""); }
  function applyStatus() { setParam("status", status || ""); }

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Returned payments</h1>

      <div className="flex items-center gap-2 mb-4">
        <input className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70" placeholder="Search returned payments..." />

        <DatePreset value={date} onChange={onDateChange} />

        <Popover button={({open})=>(
          <FilterChip><span>Type</span><span className="text-subt">{type ?? ""}</span><span className="ml-1">{open?"▴":"▾"}</span></FilterChip>
        )} className="w-[220px]">
          <div className="text-sm space-y-1">
            {TYPE.map(s=>(
              <label key={s} className="flex items-center gap-2">
                <input type="radio" name="type" checked={type===s} onChange={()=>setType(s)} /><span>{s}</span>
              </label>
            ))}
            <button className="mt-2 w-full bg-[#6d44c9] rounded h-8 text-sm" onClick={applyType}>Apply</button>
          </div>
        </Popover>

        <Popover button={({open})=>(
          <FilterChip><span>Status</span><span className="text-subt">{status ?? ""}</span><span className="ml-1">{open?"▴":"▾"}</span></FilterChip>
        )} className="w-[300px]">
          <div className="text-sm space-y-1">
            {STATUS.map(s=>(
              <label key={s} className="flex items-center gap-2">
                <input type="radio" name="status" checked={status===s} onChange={()=>setStatus(s)} /><span>{s}</span>
              </label>
            ))}
            <button className="mt-2 w-full bg-[#6d44c9] rounded h-8 text-sm" onClick={applyStatus}>Apply</button>
          </div>
        </Popover>

        <Popover button={()=>(<FilterChip>+ Add filter</FilterChip>)}>
          <div className="text-sm"><div className="px-1 py-1 hover:bg-panel/60 rounded">Amount</div></div>
        </Popover>

        <div className="ml-auto flex items-center gap-2">
          <EditColumns columns={columns} setColumns={setColumns} />
          <button className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">⬇️ Export</button>
          <NewPaymentMenu />
        </div>
      </div>

      <div className="bg-panel rounded-xl2 border border-outline/40 p-8 text-center text-subt">
        <div className="py-16">
          <div className="font-medium text-white">No returned payments found</div>
          <div className="text-sm mt-1">Try changing the filters to see returned payments.</div>
        </div>
      </div>
    </>
  );
}