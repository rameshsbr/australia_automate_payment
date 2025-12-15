"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/chrome";

export default function NewBatchPayment() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function openPicker() {
    inputRef.current?.click();
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // keep UI strict: CSV only, max 1 file (just mimicked – no upload yet)
    if (!/\.csv$/i.test(f.name)) {
      alert("Please select a CSV file");
      (e.target as HTMLInputElement).value = "";
      return;
    }
    setFile(f);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) {
      alert("Please drop a CSV file");
      return;
    }
    setFile(f);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  return (
    <AppShell>
      <div className="mb-2">
        <Link
          href="/payments/batch"
          className="text-sm text-subt hover:text-white inline-flex items-center gap-2"
        >
          ← Payments
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-4">New batch payment</h1>

      <div className="bg-panel rounded-xl2 border border-outline/40 max-w-2xl overflow-hidden">
        {/* From */}
        <div className="p-4 border-b border-outline/40">
          <div className="text-sm text-subt">From</div>

          {/* NOTE: leave data empty/placeholder – it will be filled after integration */}
          <div className="mt-2 bg-surface border border-outline/40 rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">UB AdsMedia Pty Ltd</div>
              <div className="text-xs text-subt">#</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-subt">Available</div>
              <div className="font-medium">$0.00</div>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="p-4">
          <div className="text-sm text-subt mb-1">Direct entry file upload</div>
          <div className="text-xs text-subt mb-2">CSV only, max 1 file.</div>

          <div
            className={[
              "rounded-xl border-2 border-dashed border-outline/40 transition-colors",
              dragOver ? "bg-panel/70" : "bg-transparent",
            ].join(" ")}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            <div className="px-6 py-8 text-center">
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={onFilePicked}
              />

              {/* button (not nested inside another button) */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={openPicker}
                  className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-4 h-10 text-sm"
                >
                  <span>📄</span>
                  <span>Browse files</span>
                </button>
              </div>

              <div className="mt-2 text-sm text-subt">
                or drop a file here to upload
              </div>

              {file && (
                <div className="mt-3 text-xs text-subt">
                  Selected: <span className="text-white">{file.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Download example – stub (no data wired yet) */}
          <button
            type="button"
            className="mt-3 text-sm inline-flex items-center gap-2 text-subt hover:text-white"
            // Hook your download action later
            onClick={() => alert("Example download will be wired during integration")}
          >
            <span>⬇️</span>
            <span>Download file example</span>
          </button>

          {/* Footer actions */}
          <div className="mt-4 flex items-center gap-3">
            <Link
              href="/payments/batch"
              className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-4 h-10 text-sm"
            >
              ← Back
            </Link>

            <button
              type="button"
              className="inline-flex items-center gap-2 bg-[#6d44c9] rounded-lg px-4 h-10 text-sm"
              onClick={() => alert("Review screen will be wired during integration")}
            >
              Review →
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
