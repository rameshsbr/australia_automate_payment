"use client";
import { AppShell } from "@/components/chrome";
import Link from "next/link";

export default function SimulatePayment() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">Simulate a payment</h1>
      <div className="bg-panel rounded-xl2 border border-outline/40 p-6 text-subt">
        {/* Empty now; you can add fields later */}
        Simulation UI coming soon.
      </div>
      <div className="mt-4">
        <Link href="/payments/review" className="inline-flex bg-panel border border-outline/40 rounded-lg h-9 px-4 text-sm">
          ← Back
        </Link>
      </div>
    </AppShell>
  );
}
