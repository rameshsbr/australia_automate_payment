"use client";
import { useState } from "react";
import { DayPicker, type DateRange as DayPickerRange } from "react-day-picker";
import { Popover } from "./ui";
import "react-day-picker/dist/style.css";

export type DateRange = { start?: string; end?: string };

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DayPickerRange | undefined;
  onChange: (v: DayPickerRange | undefined) => void;
}) {
  const display = [
    value?.from ? value.from.toISOString().slice(0, 10) : "",
    value?.to ? value.to.toISOString().slice(0, 10) : "",
  ]
    .filter(Boolean)
    .join(" – ");

  return (
    <Popover
      align="left"
      button={({ open }) => (
        <div className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm cursor-pointer select-none">
          <span>Date</span>
          <span className="text-subt">{display || "Select range"}</span>
          <span className="ml-1">{open ? "▴" : "▾"}</span>
        </div>
      )}
      className="w-[540px]"
    >
      <DayPicker
        mode="range"
        selected={value}
        onSelect={(range) => onChange(range)}
        defaultMonth={value?.from ?? value?.to ?? new Date()}
        numberOfMonths={2}
      />
    </Popover>
  );
}

export function DateRangeFilter({
  value,
  onChange
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  const [draft, setDraft] = useState<DateRange>(value);

  return (
    <Popover
      align="left"
      button={({ open }) => (
        <div className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">
          <span>Date</span>
          <span className="text-subt">
            {value.start && value.end ? `${value.start} to ${value.end}` : "Custom"}
          </span>
          <span className="ml-1">{open ? "▴" : "▾"}</span>
        </div>
      )}
      className="w-[340px]"
    >
      <div className="space-y-3">
        <div className="text-sm font-medium">Filter by Date</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-subt">Start</label>
            <input
              type="date"
              className="bg-panel border border-outline/40 rounded px-2 h-9 text-sm"
              value={draft.start ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-subt">End</label>
            <input
              type="date"
              className="bg-panel border border-outline/40 rounded px-2 h-9 text-sm"
              value={draft.end ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
            />
          </div>
        </div>
        <button onClick={() => onChange(draft)} className="w-full bg-[#6d44c9] rounded h-9 text-sm">
          Apply
        </button>
      </div>
    </Popover>
  );
}
