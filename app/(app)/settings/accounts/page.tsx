"use client";

import Link from "next/link";

export default function AccountsPage() {
  return (
    <>
      <div className="text-subt text-sm mb-3">
        <Link href="/settings" className="hover:underline">← Settings</Link>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Accounts</h1>

      <div className="bg-panel rounded-xl2 border border-outline/40">
        <div className="px-4 py-3 border-b border-outline/30">
          <input
            className="w-full h-9 bg-surface border border-outline/40 rounded-lg px-3 text-sm placeholder:text-subt/70"
            placeholder="Search accounts by mAccount number or name"
          />
        </div>

        <div className="px-6 py-12 text-center text-subt">
          <div className="mb-2 text-xl">🏦</div>
          <div className="font-medium text-white">No accounts yet</div>
          <div className="text-sm mt-1">Accounts will appear here once configured.</div>
        </div>
      </div>

      <div className="mt-2 text-xs text-subt">Showing 0 – 0 of 0</div>
    </>
  );
}