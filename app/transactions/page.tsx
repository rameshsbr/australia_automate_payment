import { AppShell } from "@/components/chrome";
import { TransactionsUI } from "@/components/transactions-table";
import { prisma } from "@/lib/prisma";

async function getTxs() {
  try {
    const txs = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return txs.map((t) => ({
      id: t.id,
      createdAt: t.createdAt.toISOString(),
      description: t.description,
      // WHY: Keep numbers empty until real data exists.
      debit: t.direction === "debit" ? Number(t.amountCents) / 100 : null,
      credit: t.direction === "credit" ? Number(t.amountCents) / 100 : null,
      balance: null,
      type: null
    }));
  } catch {
    return [];
  }
}

export default async function TransactionsPage() {
  const initial = await getTxs();
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Transactions</h1>
      <TransactionsUI initial={initial} />
    </AppShell>
  );
}
