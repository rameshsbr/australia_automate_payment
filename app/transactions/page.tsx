import { AppShell } from "@/components/chrome";
import { TransactionsUI } from "@/components/transactions-table";

export default async function TransactionsPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Transactions</h1>
      <TransactionsUI initial={[]} />
    </AppShell>
  );
}
