import { TransactionsUI } from "@/components/transactions-table";

export default async function TransactionsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Transactions</h1>
      <TransactionsUI initial={[]} />
    </>
  );
}
