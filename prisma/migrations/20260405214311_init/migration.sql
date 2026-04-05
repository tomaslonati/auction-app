-- CreateEnum
CREATE TYPE "UserCategory" AS ENUM ('comun', 'especial', 'plata', 'oro', 'platino');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pendiente_verificacion', 'aprobado', 'multado', 'bloqueado', 'proceso_judicial');

-- CreateEnum
CREATE TYPE "AuctionCategory" AS ENUM ('comun', 'especial', 'plata', 'oro', 'platino');

-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('programada', 'activa', 'finalizada', 'cancelada');

-- CreateEnum
CREATE TYPE "AuctionCurrency" AS ENUM ('pesos', 'dolares');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('pendiente', 'en_subasta', 'vendido', 'sin_postor');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('cuenta_bancaria', 'tarjeta_credito', 'cheque_certificado');

-- CreateEnum
CREATE TYPE "PaymentMethodStatus" AS ENUM ('pendiente', 'verificado', 'rechazado', 'expirado');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('enviada', 'confirmada', 'superada', 'rechazada');

-- CreateEnum
CREATE TYPE "ConsignmentStatus" AS ENUM ('en_evaluacion', 'aceptado', 'rechazado', 'en_deposito', 'subastado', 'vendido');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('aceptado', 'rechazado');

-- CreateEnum
CREATE TYPE "PurchasePaymentStatus" AS ENUM ('pendiente', 'pagado', 'vencido', 'judicial');

-- CreateEnum
CREATE TYPE "PenaltyStatus" AS ENUM ('pendiente', 'pagada', 'derivada_justicia');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "domicilio" TEXT NOT NULL,
    "paisOrigen" TEXT NOT NULL,
    "fotoDocFrenteUrl" TEXT,
    "fotoDocDorsoUrl" TEXT,
    "categoria" "UserCategory",
    "estado" "UserStatus" NOT NULL DEFAULT 'pendiente_verificacion',
    "registroCompletado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "PaymentMethodType" NOT NULL,
    "estado" "PaymentMethodStatus" NOT NULL DEFAULT 'pendiente',
    "esInternacional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "numeroCuenta" TEXT NOT NULL,
    "titular" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "swiftBic" TEXT,
    "iban" TEXT,
    "fondosReservados" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "ultimosCuatro" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "titular" TEXT NOT NULL,
    "mesVencimiento" INTEGER NOT NULL,
    "anioVencimiento" INTEGER NOT NULL,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certified_checks" (
    "id" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "numeroCheque" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "montoDisponible" DECIMAL(65,30) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "verificadoEn" TIMESTAMP(3),

    CONSTRAINT "certified_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auctioneers" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "matricula" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auctioneers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auctions" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "categoria" "AuctionCategory" NOT NULL,
    "estado" "AuctionStatus" NOT NULL DEFAULT 'programada',
    "moneda" "AuctionCurrency" NOT NULL,
    "rematadorId" TEXT,
    "ubicacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "numeroPieza" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precioBase" DECIMAL(65,30) NOT NULL,
    "duenUserId" TEXT,
    "duenNombreExterno" TEXT,
    "subastaId" TEXT,
    "estado" "ItemStatus" NOT NULL DEFAULT 'pendiente',
    "esCompuesto" BOOLEAN NOT NULL DEFAULT false,
    "esObraArte" BOOLEAN NOT NULL DEFAULT false,
    "artistaDisenador" TEXT,
    "fechaCreacionObra" TIMESTAMP(3),
    "historia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_components" (
    "id" TEXT NOT NULL,
    "itemPadreId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "item_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_previous_owners" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "periodo" TEXT,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "item_previous_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_images" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "item_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "auction_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "subastaId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "estado" "BidStatus" NOT NULL DEFAULT 'enviada',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "subastaId" TEXT NOT NULL,
    "compradorUserId" TEXT,
    "bidId" TEXT,
    "paymentMethodId" TEXT,
    "montoFinal" DECIMAL(65,30) NOT NULL,
    "comision" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "costoEnvio" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "retiroPersonal" BOOLEAN NOT NULL DEFAULT false,
    "estadoPago" "PurchasePaymentStatus" NOT NULL DEFAULT 'pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalties" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "estado" "PenaltyStatus" NOT NULL DEFAULT 'pendiente',
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "pagadaEn" TIMESTAMP(3),

    CONSTRAINT "penalties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT,
    "valorEstimado" DECIMAL(65,30),
    "esCompuesto" BOOLEAN NOT NULL DEFAULT false,
    "esObraArte" BOOLEAN NOT NULL DEFAULT false,
    "artistaDisenador" TEXT,
    "fechaCreacionObra" TIMESTAMP(3),
    "historia" TEXT,
    "declaraTitularidad" BOOLEAN NOT NULL DEFAULT false,
    "aceptaDevolucionConCargo" BOOLEAN NOT NULL DEFAULT false,
    "estado" "ConsignmentStatus" NOT NULL DEFAULT 'en_evaluacion',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignment_items" (
    "id" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "consignment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignment_photos" (
    "id" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "consignment_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignment_inspections" (
    "id" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL,
    "resultado" "InspectionResult" NOT NULL,
    "motivoRechazo" TEXT,
    "valorBaseAsignado" DECIMAL(65,30),
    "comisionPorcentaje" DECIMAL(65,30),
    "fechaSubastaEstimada" TIMESTAMP(3),
    "userAcepta" BOOLEAN,
    "respondidoEn" TIMESTAMP(3),
    "costoDevolucion" DECIMAL(65,30),

    CONSTRAINT "consignment_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT,
    "pais" TEXT NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignment_locations" (
    "id" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL,
    "depositId" TEXT NOT NULL,
    "sector" TEXT,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "fechaEgreso" TIMESTAMP(3),

    CONSTRAINT "consignment_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" TEXT NOT NULL,
    "numeroPoliza" TEXT NOT NULL,
    "compania" TEXT NOT NULL,
    "telefonoCompania" TEXT,
    "emailCompania" TEXT,
    "beneficiarioUserId" TEXT NOT NULL,
    "valorAsegurado" DECIMAL(65,30) NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_policy_consignments" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL,

    CONSTRAINT "insurance_policy_consignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consignmentId" TEXT,
    "banco" TEXT NOT NULL,
    "numeroCuenta" TEXT NOT NULL,
    "titular" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "swiftBic" TEXT,
    "iban" TEXT,
    "declaradaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "leidaEn" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_paymentMethodId_key" ON "bank_accounts"("paymentMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_cards_paymentMethodId_key" ON "credit_cards"("paymentMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "certified_checks_paymentMethodId_key" ON "certified_checks"("paymentMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "auctioneers_matricula_key" ON "auctioneers"("matricula");

-- CreateIndex
CREATE INDEX "bids_itemId_createdAt_idx" ON "bids"("itemId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "purchases_itemId_key" ON "purchases"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_bidId_key" ON "purchases"("bidId");

-- CreateIndex
CREATE UNIQUE INDEX "penalties_purchaseId_key" ON "penalties"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "consignment_items_consignmentId_itemId_key" ON "consignment_items"("consignmentId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "consignment_inspections_consignmentId_key" ON "consignment_inspections"("consignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "consignment_locations_consignmentId_key" ON "consignment_locations"("consignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policies_numeroPoliza_key" ON "insurance_policies"("numeroPoliza");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policy_consignments_policyId_consignmentId_key" ON "insurance_policy_consignments"("policyId", "consignmentId");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certified_checks" ADD CONSTRAINT "certified_checks_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_rematadorId_fkey" FOREIGN KEY ("rematadorId") REFERENCES "auctioneers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_duenUserId_fkey" FOREIGN KEY ("duenUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_subastaId_fkey" FOREIGN KEY ("subastaId") REFERENCES "auctions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_components" ADD CONSTRAINT "item_components_itemPadreId_fkey" FOREIGN KEY ("itemPadreId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_previous_owners" ADD CONSTRAINT "item_previous_owners_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_images" ADD CONSTRAINT "item_images_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_sessions" ADD CONSTRAINT "auction_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_sessions" ADD CONSTRAINT "auction_sessions_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_subastaId_fkey" FOREIGN KEY ("subastaId") REFERENCES "auctions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_subastaId_fkey" FOREIGN KEY ("subastaId") REFERENCES "auctions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_compradorUserId_fkey" FOREIGN KEY ("compradorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignments" ADD CONSTRAINT "consignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_items" ADD CONSTRAINT "consignment_items_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "consignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_items" ADD CONSTRAINT "consignment_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_photos" ADD CONSTRAINT "consignment_photos_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "consignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_inspections" ADD CONSTRAINT "consignment_inspections_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "consignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_locations" ADD CONSTRAINT "consignment_locations_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "consignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_locations" ADD CONSTRAINT "consignment_locations_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "deposits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_beneficiarioUserId_fkey" FOREIGN KEY ("beneficiarioUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policy_consignments" ADD CONSTRAINT "insurance_policy_consignments_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "insurance_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policy_consignments" ADD CONSTRAINT "insurance_policy_consignments_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "consignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "consignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
