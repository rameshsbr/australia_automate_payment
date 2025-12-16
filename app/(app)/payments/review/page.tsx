// file: app/payments/review/page.tsx
"use client";
import { DatePreset, EditColumns, FilterChip } from "@/components/payments-common";
import { Popover } from "@/components/ui";
import NewPaymentMenu from "@/components/payments/new-payment-menu";
import { useMemo, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

const STATUS = ["Pending approval","Approved","Rejected","Transaction Success","Transaction Failed"];
const TYPE = ["BPay","Direct Entry","mAccount"];

export default function ReviewPayments() {
  // WHY: read URL once for initial state; keep UI/URL in sync afterward.
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initialDate   = useMemo(() => searchParams.get("date")   ?? "Last 7 days",        [searchParams]);
  const initialStatus = useMemo(() => searchParams.get("status") ?? "Pending approval",   [searchParams]);
  const initialType   = useMemo(() => searchParams.get("type")   ?? "",                   [searchParams]);

  const [date, setDate] = useState(initialDate);
  const [status, setStatus] = useState<string>(initialStatus);
  const [type, setType] = useState<string|undefined>(initialType || undefined);
  const [columns, setColumns] = useState({
    submitted: true, type: true, recipient: true, createdBy: true, reference: true, status: true, amount: true
  });

  // NOTE: use arrow fns (expressions) to avoid SWC parse issues.
  const setParam = (key: string, value?: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value.length) p.set(key, value);
    else p.delete(key);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const onDateChange = (next: string) => {
    setDate(next);
    setParam("date", next);
  };

  const applyStatus = () => { setParam("status", status); };
  const applyType   = () => { setParam("type", type || ""); };

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Review payments</h1>

      {/* toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70"
          placeholder="Search payments..."
        />

        <DatePreset value={date} onChange={onDateChange} />

        <Popover
          button={({open})=>(
            <FilterChip>
              <span>Status</span>
              <span className="text-subt">{status}</span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
          className="w-[260px]"
        >
          <div className="text-sm space-y-1">
            {STATUS.map(s=>(
              <label key={s} className="flex items-center gap-2">
                <input type="radio" name="status" checked={status===s} onChange={()=>setStatus(s)} />
                <span>{s}</span>
              </label>
            ))}
            <button className="mt-2 w-full bg-[#6d44c9] rounded h-8 text-sm" onClick={applyStatus}>Apply</button>
          </div>
        </Popover>

        <Popover
          button={({open})=>(
            <FilterChip>
              <span>Type</span>
              <span className="text-subt">{type ?? ""}</span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
          className="w-[240px]"
        >
          <div className="text-sm space-y-1">
            {TYPE.map(s=>(
              <label key={s} className="flex items-center gap-2">
                <input type="radio" name="type" checked={type===s} onChange={()=>setType(s)} />
                <span>{s}</span>
              </label>
            ))}
            <button className="mt-2 w-full bg-[#6d44c9] rounded h-8 text-sm" onClick={applyType}>Apply</button>
          </div>
        </Popover>

        <Popover button={()=>(<FilterChip>+ Add filter</FilterChip>)} className="w-[220px]">
          <div className="text-sm space-y-1">
            <div className="px-1 py-1 hover:bg-panel/60 rounded">Reference</div>
            <div className="px-1 py-1 hover:bg-panel/60 rounded">Amount</div>
          </div>
        </Popover>

        <div className="ml-auto flex items-center gap-2">
          <EditColumns columns={columns} setColumns={setColumns} />
          <button className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">⬇️ Export</button>
          <NewPaymentMenu />
        </div>
      </div>

      {/* empty state */}
      <div className="bg-panel rounded-xl2 border border-outline/40 p-8 text-center text-subt">
        <div className="py-16">
          <div className="text-2xl mb-2">↔️</div>
          <div className="font-medium text-white">No payments found</div>
          <div className="text-sm mt-1">Try changing the filters or creating a new payment.</div>
          <div className="mt-4 inline-flex justify-center">
            <NewPaymentMenu />
          </div>
        </div>
      </div>
    </>
  );
}