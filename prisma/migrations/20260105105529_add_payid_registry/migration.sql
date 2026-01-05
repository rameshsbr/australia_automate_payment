-- CreateTable
CREATE TABLE "PayIdRegistry" (
    "id" TEXT NOT NULL,
    "env" TEXT NOT NULL,
    "payId" TEXT NOT NULL,
    "payIdName" TEXT,
    "bsb" TEXT NOT NULL,
    "bankAccountNumber" TEXT NOT NULL,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayIdRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayIdRegistry_env_payId_key" ON "PayIdRegistry"("env", "payId");
