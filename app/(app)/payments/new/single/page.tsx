import Link from "next/link";
import SinglePaymentForm from "@/components/payments/SinglePaymentForm";

export default function NewSinglePaymentPage() {
  return (
    <>
      <div className="mb-2">
        <Link href="/payments/review" className="text-sm text-subt hover:underline">
          ← Payments
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-6">New single payment</h1>

      <div className="max-w-3xl bg-panel rounded-xl2 border border-outline/40 p-4 md:p-6 space-y-4">
        <section>
          <div className="text-sm font-medium mb-2">From</div>
          <div className="flex items-center justify-between bg-surface border border-outline/40 rounded-lg px-3 py-3">
            <div>
              <div className="text-sm">—</div>
              <div className="text-xs text-subt">—</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-subt">Available</div>
              <div className="text-sm">—</div>
            </div>
          </div>
        </section>

        <SinglePaymentForm />
      </div>
    </>
  );
}
