import { AppShell } from "@/components/chrome";
import { prisma } from "@/lib/prisma";

async function getAccount() {
  try {
    const org = await prisma.organization.findFirst({ include: { accounts: true } });
    return org?.accounts[0] ?? null;
  } catch { return null; }
}

export default async function DashboardPage() {
  const account = await getAccount();
  const acctNo = account?.number ?? "—";
  const available = account ? (Number(account.availableCents)/100).toLocaleString(undefined,{minimumFractionDigits:2}) : "—";

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Account balance – {acctNo}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-panel rounded-xl2 border border-outline/40 p-4">
          <div className="text-sm text-subt mb-1">Available balance</div>
          <div className="text-2xl font-semibold">{account ? `$${available}` : "—"}</div>
        </div>
        <div className="bg-panel rounded-xl2 border border-outline/40 p-4">
          <div className="text-sm text-subt mb-1">Uncleared funds</div><div className="text-2xl font-semibold">—</div>
        </div>
        <div className="bg-panel rounded-xl2 border border-outline/40 p-4">
          <div className="text-sm text-subt mb-1">Daily NPP Payout Limit</div><div className="text-2xl font-semibold">—</div>
        </div>
      </div>

      <section className="bg-panel rounded-xl2 border border-outline/40 mb-6">
        <div className="flex items-center justify-between p-4">
          <div><div className="font-medium">Payments awaiting approval</div><div className="text-xs text-subt">Last 7 days</div></div>
          <a className="text-sm text-subt hover:underline" href="#">View more →</a>
        </div>
        <div className="px-4 pb-8 text-center text-subt"><div className="py-16">No payments awaiting approval</div></div>
      </section>

      <section className="bg-panel rounded-xl2 border border-outline/40">
        <div className="flex items-center justify-between p-4">
          <div><div className="font-medium">Latest transactions</div><div className="text-xs text-subt">Last 7 days</div></div>
          <a className="text-sm text-subt hover:underline" href="/transactions">View more →</a>
        </div>
        <div className="px-4 pb-8 text-center text-subt"><div className="py-16">No recent transactions</div></div>
      </section>
    </AppShell>
  );
}
