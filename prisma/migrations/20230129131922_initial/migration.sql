-- CreateTable
CREATE TABLE "Wallet" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "totalEarnings" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");
