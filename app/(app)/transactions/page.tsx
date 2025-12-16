// file: app/(app)/transactions/page.tsx
// WHY: live DB for live routes.

import { prismaLive as prisma } from "@/lib/prisma";

export default async function TransactionsPage() {
  const txs = await prisma.transaction.findMany({ take: 20 }).catch(() => []);
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Transactions (Live)</h1>
      <div className="text-subt text-sm">Rows: {txs.length}</div>
    </div>
  );
}