"use client";
import type React from "react";
import { Popover, Toggle } from "./ui";
import { useState } from "react";

export function DatePreset({
  value, onChange, label="Date"
}: { value: string; onChange:(v:string)=>void; label?:string }) {
  const [preset, setPreset] = useState(value || "Last 7 days");
  const options = ["Today","Yesterday","Last 7 days","Last Week","This Month","Last Month","Custom"];
  return (
    <Popover
      button={({open})=>(
        <div className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">
          <span>{label}</span><span className="text-subt">{preset}</span><span className="ml-1">{open?"▴":"▾"}</span>
        </div>
      )}
      className="w-[280px]"
    >
      <div className="space-y-2 text-sm">
        <select className="w-full bg-panel border border-outline/40 rounded h-9 px-2"
          value={preset} onChange={(e)=>setPreset(e.target.value)}>
          {options.map(o=><option key={o}>{o}</option>)}
        </select>
        {/* Minimal custom date inputs are hidden until "Custom" is chosen; keep UI identical without logic */}
        <button className="w-full bg-[#6d44c9] rounded h-9 text-sm" onClick={()=>onChange(preset)}>Apply</button>
      </div>
    </Popover>
  );
}

export function EditColumns({
  columns, setColumns
}:{ columns: Record<string, boolean>; setColumns:(c:Record<string,boolean>)=>void }) {
  return (
    <Popover align="right"
      button={({open})=>(
        <div className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">
          <span>✏️ Edit columns</span><span className="ml-1">{open?"▴":"▾"}</span>
        </div>
      )}
      className="w-[260px]"
    >
      <div className="text-sm">
        {Object.keys(columns).map(k=>(
          <div key={k} className="flex items-center justify-between py-1">
            <span className="capitalize">{k.replace(/([A-Z])/g," $1").toLowerCase()}</span>
            <Toggle checked={!!columns[k]} onChange={(v)=>setColumns({...columns,[k]:v})}/>
          </div>
        ))}
      </div>
    </Popover>
  );
}

export function FilterChip({
  children,
  className = "",
  onClick,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(e as any);
        }
      }}
      onClick={onClick}
      className={`inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm cursor-pointer select-none ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
