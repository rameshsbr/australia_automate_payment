"use client";
import { DatePreset, EditColumns, FilterChip } from "@/components/payments-common";
import { Popover } from "@/components/ui";
import { EmptyStatePanel, FooterPagination } from "@/components/payments-widgets";
import { useState } from "react";

const CARD_TYPES = ["Refund", "Chargeback", "Payment"];
const CARD_COLUMNS = [
  "Created",
  "Description",
  "Card type",
  "Status",
  "Amount",
  "Type",
  "Transaction unique reference",
  "Settlement date",
  "Payment token unique reference",
  "Customer ID",
  "Surcharge amount",
  "Card number",
  "Expiration date",
  "Cardholder name",
  "Issuer",
  "Refund status"
];

export default function Page() {
  const [date, setDate] = useState("Last 7 days");
  const [type, setType] = useState<string | undefined>(undefined);
  const [columns, setColumns] = useState<Record<string, boolean>>(
    Object.fromEntries(CARD_COLUMNS.map((c, i) => [c, i < 6]))
  );

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Card payments</h1>

      <div className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70"
          placeholder="Search by description..."
        />

        <DatePreset value={date} onChange={setDate} />

        <Popover
          className="w-[260px]"
          button={({ open }) => (
            <FilterChip>
              <span>Type</span>
              <span className="text-subt">{type ?? ""}</span>
              <span className="ml-1">{open ? "▴" : "▾"}</span>
            </FilterChip>
          )}
        >
          <div className="text-sm space-y-1">
            {CARD_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input type="radio" name="cardtype" checked={type === t} onChange={() => setType(t)} />
                <span>{t}</span>
              </label>
            ))}
            <button className="mt-2 w-full bg-[#6d44c9] rounded h-8 text-sm">Apply</button>
          </div>
        </Popover>

        <Popover button={() => <FilterChip>+ Add filter</FilterChip>} className="w-[220px]">
          <div className="text-sm space-y-1">
            <div className="px-1 py-1 hover:bg-panel/60 rounded">Reference</div>
          </div>
        </Popover>

        <div className="ml-auto flex items-center gap-2">
          <EditColumns columns={columns} setColumns={setColumns} />
          <button className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">
            ⬇️ Export
          </button>
        </div>
      </div>

      <EmptyStatePanel icon="💳" title="No card payments found" subtitle="Try changing the filters." />

      <FooterPagination />
    </>
  );
}
