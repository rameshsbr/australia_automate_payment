// file: app/sandbox/summary/page.tsx
// WHY: fetch from SANDBOX DB, not by re-exporting the live page.

import { prismaSandbox as prisma } from "@/lib/prisma";

export default async function SummaryPageSandbox() {
  const org = await prisma.organization.findFirst().catch(() => null);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Summary (Sandbox)</h1>
      <div className="text-subt text-sm">
        {org ? "Organization connected." : "No data yet."}
      </div>
    </div>
  );
}