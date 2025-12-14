"use client";

import { Popover } from "@/components/ui";
import { useRouter } from "next/navigation";

type Props = {
  /** If you ever want a compact trigger elsewhere, you can change this later */
  label?: string;
  className?: string;
};

export default function NewPaymentMenu({ label = "+ New payment", className = "" }: Props) {
  const router = useRouter();
  const go = (path: string) => () => router.push(path);

  return (
    <Popover
      align="right"
      button={({ open }) => (
        <button
          type="button"
          className={`inline-flex items-center gap-2 bg-[#6d44c9] rounded-lg px-3 h-9 text-sm ${className}`}
        >
          {label} <span className="ml-1">{open ? "▴" : "▾"}</span>
        </button>
      )}
    >
      <div className="text-sm">
        <button onClick={go("/payments/new/single")} className="block w-full text-left px-2 py-1 rounded hover:bg-panel/60">
          Single payment
        </button>
        <button onClick={go("/payments/new/batch")} className="block w-full text-left px-2 py-1 rounded hover:bg-panel/60">
          Batch payment
        </button>
        <button onClick={go("/payments/new/simulate")} className="block w-full text-left px-2 py-1 rounded hover:bg-panel/60">
          Simulate a payment
        </button>
      </div>
    </Popover>
  );
}
