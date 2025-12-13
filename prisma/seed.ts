import { PrismaClient, Environment } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "seed-org" },
    create: { id: "seed-org", name: "UB AdsMedia Pty Ltd" },
    update: {}
  });

  const account = await prisma.account.upsert({
    where: { number: "6279059743697945" },
    create: {
      organizationId: org.id,
      name: "UB AdsMedia Pty Ltd Account",
      number: "6279059743697945",
      environment: "SANDBOX",
      availableCents: BigInt(0)
    },
    update: {}
  });

  const count = await prisma.transaction.count({ where: { accountId: account.id } });
  if (count === 0) {
    const txs = Array.from({ length: 4 }).map((_, i) => ({
      accountId: account.id,
      environment: "SANDBOX" as Environment,
      amountCents: BigInt((i % 2 === 0 ? 1 : -1) * (10000 + i * 531)),
      currency: "AUD",
      direction: i % 2 === 0 ? "credit" : "debit",
      description: i % 2 === 0 ? "Payment received" : "Payout processed"
    }));
    await prisma.transaction.createMany({ data: txs });
  }

  await prisma.apiKey.upsert({
    where: { key: "sk_demo_clone_api_key_change_me" },
    create: {
      key: "sk_demo_clone_api_key_change_me",
      label: "Sandbox key",
      environment: "SANDBOX",
      organizationId: org.id
    },
    update: {}
  });

  console.log("Seed complete (idempotent).");
}
main().finally(() => prisma.$disconnect());
