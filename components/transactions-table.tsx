"use client";
import { DateRange, DateRangeFilter } from "./date-range";
import { Popover, Toggle } from "./ui";
import { useMemo, useState } from "react";

type Tx = {
  id: string;
  createdAt: string;
  description?: string | null;
  debit?: number | null;
  credit?: number | null;
  balance?: number | null;
  type?: string | null;
};

const TYPE_OPTIONS = ["Direct Debit","Direct Credit","NPP Direct Credit","BPay Out","NPP Receivable","DE Receivable","DE Direct Debit","BPay Receivable"];

const ALL_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "description", label: "Description" },
  { key: "debit", label: "Debit" },
  { key: "credit", label: "Credit" },
  { key: "balance", label: "Balance" },
  { key: "reference", label: "Reference" },
  { key: "transactionId", label: "Transaction ID" },
  { key: "identifier", label: "Identifier" }
] as const;

export function TransactionsUI({ initial }:{ initial: Tx[] }) {
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<DateRange>({});
  const [type, setType] = useState<string | null>(null);
  const [columns, setColumns] = useState<Record<string, boolean>>({
    date: true, description: true, debit: true, credit: true, balance: true,
    reference: false, transactionId: false, identifier: false
  });

  const visibleCols = ALL_COLUMNS.filter(c => columns[c.key]);

  const filtered = useMemo(() => {
    let data = initial;
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(t =>
        t.description?.toLowerCase().includes(s) || t.id.toLowerCase().includes(s)
      );
    }
    if (range.start) data = data.filter(t => new Date(t.createdAt) >= new Date(range.start!));
    if (range.end) data = data.filter(t => new Date(t.createdAt) <= new Date(range.end! + "T23:59:59"));
    if (type) data = data.filter(t => (t.type ?? "") === type);
    return data;
  }, [initial, search, range, type]);

  const resetFilters = () => { setSearch(""); setRange({}); setType(null); };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <input value={search} onChange={(e)=>setSearch(e.target.value)}
          className="w-[360px] bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70 focus:outline-none"
          placeholder="Search transactions..." />
        <DateRangeFilter value={range} onChange={setRange} />
        <Popover button={({open})=>(
          <div className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">
            <span>Type</span><span className="text-subt">{type ?? ""}</span><span className="ml-1">{open?"▴":"▾"}</span>
          </div>
        )}>
          <div className="text-sm">
            <div className="text-sm mb-2">Filter by Type</div>
            <div className="max-h-56 overflow-auto pr-1 space-y-1">
              {TYPE_OPTIONS.map(opt=>(
                <label key={opt} className="flex items-center gap-2">
                  <input type="radio" name="type" checked={type===opt} onChange={()=>setType(opt)} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            <button onClick={()=>setType(null)} className="mt-3 text-xs text-subt hover:underline">Clear</button>
          </div>
        </Popover>
        <button className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">+ Add filter</button>
        <button onClick={resetFilters} className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">Reset filters</button>

        <div className="ml-auto flex items-center gap-2">
          <Popover align="right" className="w-[260px]"
            button={({open})=>(
              <div className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">
                <span>✏️ Edit columns</span><span className="ml-1">{open?"▴":"▾"}</span>
              </div>
            )}>
            <div className="text-sm">
              {ALL_COLUMNS.map(c=>(
                <div key={c.key} className="flex items-center justify-between py-1">
                  <span>{c.label}</span>
                  <Toggle checked={!!columns[c.key]} onChange={(v)=>setColumns(s=>({...s,[c.key]:v}))}/>
                </div>
              ))}
            </div>
          </Popover>
          <button className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">⬇️ Export</button>
          <Popover align="right" button={()=>(<div className="inline-flex items-center gap-2 bg-[#6d44c9] rounded-lg px-3 h-9 text-sm">+ New payment</div>)}>
            <div className="text-sm">
              <button className="block w-full text-left px-2 py-1 rounded hover:bg-panel/60">Single payment</button>
              <button className="block w-full text-left px-2 py-1 rounded hover:bg-panel/60">Batch payment</button>
              <button className="block w-full text-left px-2 py-1 rounded hover:bg-panel/60">Simulate a payment</button>
            </div>
          </Popover>
        </div>
      </div>

      <div className="bg-panel rounded-xl2 border border-outline/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-subt">{visibleCols.map(c=>(
            <th key={c.key} className="text-left font-normal px-4 py-3 border-b border-outline/30">{c.label}</th>
          ))}</tr></thead>
          <tbody>
          {filtered.length===0 ? (
            <tr><td className="px-4 py-10 text-center text-subt" colSpan={visibleCols.length}>No transactions</td></tr>
          ) : filtered.map(t=>(
            <tr key={t.id} className="hover:bg-surface/50">
              {visibleCols.map(c=>{
                const key = c.key as typeof ALL_COLUMNS[number]["key"];
                let value: React.ReactNode = "—";
                if (key==="date") value = new Date(t.createdAt).toLocaleString();
                if (key==="description") value = t.description ?? "—";
                if (key==="debit") value = t.debit!=null ? `$${t.debit.toFixed(2)}` : "—";
                if (key==="credit") value = t.credit!=null ? `$${t.credit.toFixed(2)}` : "—";
                if (key==="balance") value = t.balance!=null ? `$${t.balance.toFixed(2)}` : "—";
                return <td key={key} className="px-4 py-3 border-b border-outline/20 align-top">{value}</td>;
              })}
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
