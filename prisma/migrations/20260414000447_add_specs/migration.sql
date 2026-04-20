/*
  Warnings:

  - You are about to drop the column `paisOrigen` on the `users` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `insurance_policies` table without a default value. This is not possible if the table is not empty.
  - Made the column `compradorUserId` on table `purchases` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bidId` on table `purchases` required. This step will fail if there are existing NULL values in that column.
  - Made the column `paymentMethodId` on table `purchases` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_bidId_fkey";

-- DropForeignKey
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_compradorUserId_fkey";

-- DropForeignKey
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_paymentMethodId_fkey";

-- AlterTable
ALTER TABLE "auction_sessions" ADD COLUMN     "numeroPostor" INTEGER;

-- AlterTable
ALTER TABLE "auctioneers" ADD COLUMN     "region" TEXT;

-- AlterTable
ALTER TABLE "auctions" ADD COLUMN     "capacidadAsistentes" INTEGER,
ADD COLUMN     "hora" TEXT,
ADD COLUMN     "seguridadPropia" BOOLEAN,
ADD COLUMN     "streamingUrl" TEXT,
ADD COLUMN     "tieneDeposito" BOOLEAN;

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "numeroPaisId" INTEGER,
ALTER COLUMN "pais" DROP NOT NULL;

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "ganador" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "consignment_locations" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "deposits" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "numeroPaisId" INTEGER,
ALTER COLUMN "pais" DROP NOT NULL;

-- AlterTable
ALTER TABLE "insurance_policies" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "polizaCombinada" BOOLEAN,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "item_images" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "catalogoId" TEXT,
ADD COLUMN     "comision" DECIMAL(65,30),
ADD COLUMN     "descripcionCatalogo" TEXT,
ADD COLUMN     "descripcionCompleta" TEXT,
ADD COLUMN     "disponible" BOOLEAN,
ADD COLUMN     "fecha" TIMESTAMP(3),
ADD COLUMN     "revisorId" TEXT,
ADD COLUMN     "seguroId" TEXT;

-- AlterTable
ALTER TABLE "payout_accounts" ADD COLUMN     "numeroPaisId" INTEGER,
ALTER COLUMN "pais" DROP NOT NULL;

-- AlterTable
ALTER TABLE "penalties" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "purchases" ALTER COLUMN "compradorUserId" SET NOT NULL,
ALTER COLUMN "bidId" SET NOT NULL,
ALTER COLUMN "paymentMethodId" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "paisOrigen",
ADD COLUMN     "admitido" BOOLEAN,
ADD COLUMN     "calificacionRiesgo" INTEGER,
ADD COLUMN     "documento" TEXT,
ADD COLUMN     "fotoPerfilUrl" TEXT,
ADD COLUMN     "numeroPais" INTEGER,
ADD COLUMN     "verificacionFinanciera" BOOLEAN,
ADD COLUMN     "verificacionJudicial" BOOLEAN,
ADD COLUMN     "verificadorId" TEXT;

-- CreateTable
CREATE TABLE "paises" (
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreCorto" TEXT,
    "capital" TEXT NOT NULL,
    "nacionalidad" TEXT NOT NULL,
    "idiomas" TEXT NOT NULL,

    CONSTRAINT "paises_pkey" PRIMARY KEY ("numero")
);

-- CreateTable
CREATE TABLE "sectores" (
    "id" TEXT NOT NULL,
    "nombreSector" TEXT NOT NULL,
    "codigoSector" TEXT,
    "responsableSectorId" TEXT,

    CONSTRAINT "sectores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "cargo" TEXT,
    "sectorId" TEXT,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogos" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "subastaId" TEXT,
    "responsableId" TEXT NOT NULL,

    CONSTRAINT "catalogos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_specs" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "auction_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignment_specs" (
    "id" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "consignment_specs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auction_specs_auctionId_clave_key" ON "auction_specs"("auctionId", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "consignment_specs_consignmentId_clave_key" ON "consignment_specs"("consignmentId", "clave");

-- AddForeignKey
ALTER TABLE "sectores" ADD CONSTRAINT "sectores_responsableSectorId_fkey" FOREIGN KEY ("responsableSectorId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogos" ADD CONSTRAINT "catalogos_subastaId_fkey" FOREIGN KEY ("subastaId") REFERENCES "auctions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogos" ADD CONSTRAINT "catalogos_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_numeroPais_fkey" FOREIGN KEY ("numeroPais") REFERENCES "paises"("numero") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_verificadorId_fkey" FOREIGN KEY ("verificadorId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_numeroPaisId_fkey" FOREIGN KEY ("numeroPaisId") REFERENCES "paises"("numero") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_specs" ADD CONSTRAINT "auction_specs_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_seguroId_fkey" FOREIGN KEY ("seguroId") REFERENCES "insurance_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_catalogoId_fkey" FOREIGN KEY ("catalogoId") REFERENCES "catalogos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_compradorUserId_fkey" FOREIGN KEY ("compradorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_specs" ADD CONSTRAINT "consignment_specs_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "consignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_numeroPaisId_fkey" FOREIGN KEY ("numeroPaisId") REFERENCES "paises"("numero") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_numeroPaisId_fkey" FOREIGN KEY ("numeroPaisId") REFERENCES "paises"("numero") ON DELETE SET NULL ON UPDATE CASCADE;
