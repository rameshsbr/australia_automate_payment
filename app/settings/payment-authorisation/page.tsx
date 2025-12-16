"use client";

import Link from "next/link";
import { AppShell } from "@/components/chrome";

export default function PaymentAuthorisationPage() {
  return (
    <AppShell>
      <div className="text-subt text-sm mb-3">
        <Link href="/settings" className="hover:underline">
          ← Settings
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Payment authorisation</h1>

      <div className="max-w-3xl space-y-4">
        <div className="bg-panel rounded-xl2 border border-outline/40 p-4">
          <div className="text-sm text-subt mb-3">
            Authorisation settings are managed by Monova. Contact support to update these settings.
          </div>
          <button className="inline-flex items-center gap-2 bg-surface border border-outline/40 rounded-lg h-9 px-3 text-sm">
            💬 Contact support
          </button>
        </div>

        <div className="bg-panel rounded-xl2 border border-outline/40">
          <div className="px-5 py-4 border-b border-outline/30">
            <div className="font-medium text-white">Payment type</div>
            <div className="text-sm text-subt mt-1">
              Selected payment types will be reviewed by users with the payment approver permission.
            </div>
          </div>
          <div className="px-5 py-4 text-sm text-subt">
            {/* intentionally empty – to be populated once data is available */}
            —
          </div>
        </div>

        <div className="bg-panel rounded-xl2 border border-outline/40">
          <div className="px-5 py-4">
            <div className="font-medium text-white">Minimum authorisation amount</div>
            <div className="text-sm text-subt mt-1">
              Any payment above the threshold will be reviewed by approvers before processing.
            </div>
            <div className="mt-3 text-white">$0.00</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
