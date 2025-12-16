// file: app/sandbox/transactions/page.tsx
// WHY: sandbox DB for sandbox routes.

import { prismaSandbox as prisma } from "@/lib/prisma";

export default async function TransactionsPageSandbox() {
  const txs = await prisma.transaction.findMany({ take: 20 }).catch(() => []);
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Transactions (Sandbox)</h1>
      <div className="text-subt text-sm">Rows: {txs.length}</div>
    </div>
  );
}