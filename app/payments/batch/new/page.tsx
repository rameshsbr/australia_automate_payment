"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/chrome";

export default function NewBatchPaymentPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function onPick() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFileName(f ? f.name : null);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    setFileName(f ? f.name : null);
  }

  return (
    <AppShell>
      <div className="text-sm text-subt mb-2">← Payments</div>
      <h1 className="text-2xl font-semibold mb-6">New batch payment</h1>

      <div className="bg-panel rounded-xl2 border border-outline/40 p-4 max-w-[680px]">
        {/* From */}
        <div className="bg-surface rounded-lg border border-outline/30 p-3 mb-6">
          <div className="text-sm text-subt mb-1">From</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">UB AdsMedia Pty Ltd</div>
              <div className="text-subt text-sm">#6279059737797230</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-subt">Available</div>
              <div className="text-white">$0.00</div>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="mb-2 font-medium">Direct entry file upload</div>
        <div className="text-xs text-subt mb-3">CSV only, max 1 file.</div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="border border-dashed border-outline/50 rounded-lg p-8 text-center"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onFileChange}
          />
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onPick}
              className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm"
            >
              📄 Browse files
            </button>
            <div className="text-sm text-subt">or drop a file here to upload</div>
            {fileName ? <div className="text-xs mt-1">Selected: {fileName}</div> : null}
          </div>
        </div>

        <button
          type="button"
          className="mt-3 text-sm inline-flex items-center gap-2 text-subt hover:text-white"
        >
          ⤓ Download file example
        </button>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-4 h-10 text-sm"
          >
            ← Back
          </button>
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-2 bg-[#6d44c9] rounded-lg px-5 h-10 text-sm"
          >
            Review →
          </button>
        </div>
      </div>
    </AppShell>
  );
}
