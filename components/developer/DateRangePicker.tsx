"use client";
import { useMemo, useState } from "react";
import { Popover } from "@/components/ui";
import { FilterChip } from "@/components/payments-common";

type DateValue = { from: string; to: string; startTime?: string; endTime?: string };

type Props = {
  label?: string;
  value?: DateValue;
  onApply: (next: DateValue) => void;
};

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

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function DateRangePicker({ label = "Date", value, onApply }: Props) {
  const today = new Date();
  const initialFrom = value?.from ?? formatDate(addDays(today, -6));
  const initialTo = value?.to ?? formatDate(today);

  const [cursor, setCursor] = useState<Date>(new Date(value?.to ?? today));
  const [from, setFrom] = useState<string>(initialFrom);
  const [to, setTo] = useState<string>(initialTo);
  const [startTime, setStartTime] = useState(value?.startTime ?? "00:00:00");
  const [endTime, setEndTime] = useState(value?.endTime ?? "23:59:59");

  const monthDays = useMemo(() => {
    const start = startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
    return Array.from({ length: 42 }).map((_, i) => addDays(start, i));
  }, [cursor]);

  function pick(date: Date) {
    const iso = formatDate(date);
    if (!from || (from && to)) {
      setFrom(iso);
      setTo("");
      return;
    }

    if (new Date(iso).getTime() < new Date(from).getTime()) {
      setTo(from);
      setFrom(iso);
    } else {
      setTo(iso);
    }
  }

  const summary = `${from || ""} to ${to || ""}`;

  const isActive = (date: Date) => {
    const iso = formatDate(date);
    if (from && !to) return iso === from;
    if (from && to) {
      return new Date(iso) >= new Date(from) && new Date(iso) <= new Date(to);
    }
    return false;
  };

  return (
    <Popover
      button={({ open }) => (
        <FilterChip>
          <span>{label}</span>
          <span className="text-subt">{summary}</span>
          <span className="ml-1">{open ? "▴" : "▾"}</span>
        </FilterChip>
      )}
      className="w-[340px]"
    >
      <div className="text-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-2">
            <select
              className="bg-panel border border-outline/40 rounded px-2 h-8"
              value={cursor.getMonth()}
              onChange={(e) =>
                setCursor(new Date(cursor.getFullYear(), Number(e.target.value), cursor.getDate()))
              }
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              className="bg-panel border border-outline/40 rounded px-2 h-8"
              value={cursor.getFullYear()}
              onChange={(e) =>
                setCursor(new Date(Number(e.target.value), cursor.getMonth(), cursor.getDate()))
              }
            >
              {Array.from({ length: 6 }).map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="inline-flex gap-1">
            <button
              className="bg-surface rounded px-2 h-8 border border-outline/40"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              ‹
            </button>
            <button
              className="bg-surface rounded px-2 h-8 border border-outline/40"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2 text-center opacity-70">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((date) => {
            const inMonth = date.getMonth() === cursor.getMonth();
            const iso = formatDate(date);
            const active = isActive(date);

            return (
              <button
                key={iso}
                onClick={() => pick(date)}
                className={`h-8 rounded border ${
                  active ? "bg-[#6d44c9] border-transparent" : "bg-panel border-outline/40"
                } ${inMonth ? "" : "opacity-40"}`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs opacity-80">
            Start
            <input
              className="mt-1 w-full bg-panel border border-outline/40 rounded h-8 px-2"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="00:00:00"
            />
          </label>
          <label className="text-xs opacity-80">
            End
            <input
              className="mt-1 w-full bg-panel border border-outline/40 rounded h-8 px-2"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="23:59:59"
            />
          </label>
        </div>

        <button
          className="mt-3 w-full bg-[#6d44c9] rounded h-8 text-sm disabled:opacity-60"
          disabled={!from || !to}
          onClick={() => onApply({ from, to, startTime, endTime })}
        >
          Apply
        </button>
      </div>
    </Popover>
  );
}
