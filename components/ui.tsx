"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}

/** WHY: Minimal headless popover/dropdown for reuse without heavy deps. */
export function Popover({
  button,
  className,
  children,
  align = "left",
  open: controlledOpen,
  onOpenChange
}: {
  button: (args: { open: boolean }) => ReactNode;
  className?: string;
  children: ReactNode | ((args: { close: () => void }) => ReactNode);
  align?: "left" | "right";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, setOpen]);

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
          {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
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
