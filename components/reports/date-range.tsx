"use client";

import { useEffect, useMemo, useState } from "react";
import { Popover } from "@/components/ui";

type DateRange = { start: Date | null; end: Date | null };

function fmt(d?: Date | null) {
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function daysInMonth(year: number, monthIdx: number) {
  return new Date(year, monthIdx + 1, 0).getDate();
}
function startWeekday(year: number, monthIdx: number) {
  // 0 = Sun .. 6 = Sat
  return new Date(year, monthIdx, 1).getDay();
}

export default function DateRangePicker({
  value,
  onChange,
  label = "Date range",
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  label?: string;
}) {
  const [draft, setDraft] = useState<DateRange>(value);
  const [view, setView] = useState<Date>(value.start ?? new Date());

  // keep external value in sync if parent updates
  useEffect(() => {
    setDraft(value);
    if (value.start) setView(value.start);
  }, [value.start, value.end]);

  const year = view.getFullYear();
  const monthIdx = view.getMonth();
  const dim = daysInMonth(year, monthIdx);
  const firstW = startWeekday(year, monthIdx);

  const grid: (Date | null)[] = useMemo(() => {
    const arr: (Date | null)[] = [];
    for (let i = 0; i < firstW; i++) arr.push(null);
    for (let d = 1; d <= dim; d++) arr.push(new Date(year, monthIdx, d));
    // pad to full weeks (42 cells)
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, monthIdx, dim, firstW]);

  function selectDay(day: Date) {
    const { start, end } = draft;
    if (!start || (start && end)) {
      setDraft({ start: day, end: null });
    } else if (start) {
      if (day < start) setDraft({ start: day, end: start });
      else setDraft({ start, end: day });
    }
  }

  function inRange(day: Date) {
    const { start, end } = draft;
    if (!start || !end) return false;
    const t = day.setHours(0, 0, 0, 0);
    const s = start.setHours(0, 0, 0, 0);
    const e = end.setHours(0, 0, 0, 0);
    return t >= s && t <= e;
  }
  function isStart(day: Date) {
    return draft.start?.toDateString() === day.toDateString();
  }
  function isEnd(day: Date) {
    return draft.end?.toDateString() === day.toDateString();
  }

  const display = draft.start && draft.end
    ? `${fmt(draft.start)} – ${fmt(draft.end)}`
    : draft.start
    ? `${fmt(draft.start)}`
    : "";

  function apply() {
    onChange(draft);
  }
  function clear() {
    const empty = { start: null, end: null };
    setDraft(empty);
    onChange(empty);
  }

  return (
    <Popover
      align="start"
      button={({ open }) => (
        <div className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm cursor-pointer select-none">
          <span>{label}</span>
          <span className="text-subt">{display}</span>
          <span className="ml-1">{open ? "▴" : "▾"}</span>
        </div>
      )}
      className="w-[320px]"
    >
      <div className="space-y-3">
        {/* Header: month/year + arrows */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <select
              className="bg-panel border border-outline/40 rounded px-2 py-1 text-sm"
              value={monthIdx}
              onChange={(e) => setView(new Date(year, Number(e.target.value), 1))}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="bg-panel border border-outline/40 rounded px-2 py-1 text-sm"
              value={year}
              onChange={(e) => setView(new Date(Number(e.target.value), monthIdx, 1))}
            >
              {Array.from({ length: 21 }, (_, i) => year - 10 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="bg-panel border border-outline/40 rounded px-2 py-1"
              onClick={() => setView(new Date(year, monthIdx - 1, 1))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              className="bg-panel border border-outline/40 rounded px-2 py-1"
              onClick={() => setView(new Date(year, monthIdx + 1, 1))}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        {/* Week header */}
        <div className="grid grid-cols-7 text-xs text-subt">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            if (!d) return <div key={i} className="h-8" />;
            const active = isStart(d) || isEnd(d);
            const ranged = inRange(d);
            return (
              <button
                key={i}
                onClick={() => selectDay(d)}
                className={[
                  "h-8 rounded text-sm",
                  ranged ? "bg-[#6d44c9]/30" : "",
                  active ? "bg-[#6d44c9] text-white" : "hover:bg-panel/60",
                ].join(" ")}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          <button onClick={clear} className="text-sm text-subt hover:text-white">
            Clear
          </button>
          <button onClick={apply} className="bg-[#6d44c9] rounded px-3 h-8 text-sm">
            Apply
          </button>
        </div>
      </div>
    </Popover>
  );
}
