"use client";
import { FilterChip } from "@/components/payments-common";
import { FooterPagination, EmptyStatePanel } from "@/components/payments-widgets";
import { Popover } from "@/components/ui";
import { useState } from "react";

const PAYEE_TYPES = ["Bank Account", "BPay biller"];

export default function Page() {
  const [type, setType] = useState<string | undefined>(undefined);

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Payees</h1>

      <div className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70"
          placeholder="Search payees..."
        />

        <Popover
          className="w-[220px]"
          button={({ open }) => (
            <FilterChip>
              <span>Type</span>
              <span className="text-subt">{type ?? ""}</span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
        >
          <div className="text-sm space-y-1">
            {PAYEE_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input type="radio" name="payeeType" checked={type === t} onChange={() => setType(t)} />
                <span>{t}</span>
              </label>
            ))}
            <button className="mt-2 w-full bg-[#6d44c9] rounded h-8 text-sm">Apply</button>
          </div>
        </Popover>

        <div className="ml-auto flex items-center gap-2">
          <Popover
            align="right"
            button={() => (
              <div className="inline-flex items-center gap-2 bg-[#6d44c9] rounded-lg px-3 h-9 text-sm">
                + New payee
              </div>
            )}
          >
            <div className="text-sm">
              <button className="block w-full text-left px-3 py-2 rounded hover:bg-panel/60">🏦 Bank account</button>
              <button className="block w-full text-left px-3 py-2 rounded hover:bg-panel/60">🧾 BPay biller</button>
            </div>
          </Popover>
        </div>
      </div>

      <EmptyStatePanel icon="👤" title="No payees" subtitle="Create a new payee to get started." />

      <FooterPagination />
    </>
  );
}
