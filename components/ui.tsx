"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

/** WHY: Minimal headless popover/dropdown for reuse without heavy deps. */
export function Popover({
  button,
  className,
  children,
  align = "left"
}: {
  button: (args: { open: boolean }) => ReactNode;
  className?: string;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} className="relative inline-block">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        {button({ open })}
      </div>
      {open && (
        <div
          className={clsx(
            "absolute z-20 mt-2 min-w-[240px] bg-surface border border-outline/40 rounded-lg shadow-soft p-3",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-10 h-5 bg-outline/50 rounded-full peer peer-checked:bg-accent transition" />
      <div
        className={clsx(
          "absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </label>
  );
}
