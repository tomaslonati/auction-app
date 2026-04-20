-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public._prisma_migrations (
  id character varying NOT NULL,
  checksum character varying NOT NULL,
  finished_at timestamp with time zone,
  migration_name character varying NOT NULL,
  logs text,
  rolled_back_at timestamp with time zone,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0,
  CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.auction_sessions (
  id text NOT NULL,
  userId text NOT NULL,
  auctionId text NOT NULL,
  connectedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disconnectedAt timestamp without time zone,
  numeroPostor integer,
  CONSTRAINT auction_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT auction_sessions_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id),
  CONSTRAINT auction_sessions_auctionId_fkey FOREIGN KEY (auctionId) REFERENCES public.auctions(id)
);
CREATE TABLE public.auction_specs (
  id text NOT NULL,
  auctionId text NOT NULL,
  clave text NOT NULL,
  valor text NOT NULL,
  CONSTRAINT auction_specs_pkey PRIMARY KEY (id),
  CONSTRAINT auction_specs_auctionId_fkey FOREIGN KEY (auctionId) REFERENCES public.auctions(id)
);
CREATE TABLE public.auctioneers (
  id text NOT NULL,
  nombre text NOT NULL,
  apellido text NOT NULL,
  matricula text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  region text,
  CONSTRAINT auctioneers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.auctions (
  id text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  fechaInicio timestamp without time zone NOT NULL,
  fechaFin timestamp without time zone,
  categoria USER-DEFINED NOT NULL,
  estado USER-DEFINED NOT NULL DEFAULT 'programada'::"AuctionStatus",
  moneda USER-DEFINED NOT NULL,
  rematadorId text,
  ubicacion text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  capacidadAsistentes integer,
  hora text,
  seguridadPropia boolean,
  streamingUrl text,
  tieneDeposito boolean,
  CONSTRAINT auctions_pkey PRIMARY KEY (id),
  CONSTRAINT auctions_rematadorId_fkey FOREIGN KEY (rematadorId) REFERENCES public.auctioneers(id)
);
CREATE TABLE public.bank_accounts (
  id text NOT NULL,
  paymentMethodId text NOT NULL,
  banco text NOT NULL,
  numeroCuenta text NOT NULL,
  titular text NOT NULL,
  pais text,
  moneda text NOT NULL,
  swiftBic text,
  iban text,
  fondosReservados numeric NOT NULL DEFAULT 0,
  numeroPaisId integer,
  CONSTRAINT bank_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT bank_accounts_paymentMethodId_fkey FOREIGN KEY (paymentMethodId) REFERENCES public.payment_methods(id),
  CONSTRAINT bank_accounts_numeroPaisId_fkey FOREIGN KEY (numeroPaisId) REFERENCES public.paises(numero)
);
CREATE TABLE public.bids (
  id text NOT NULL,
  subastaId text NOT NULL,
  itemId text NOT NULL,
  userId text NOT NULL,
  paymentMethodId text NOT NULL,
  monto numeric NOT NULL,
  estado USER-DEFINED NOT NULL DEFAULT 'enviada'::"BidStatus",
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ganador boolean NOT NULL DEFAULT false,
  CONSTRAINT bids_pkey PRIMARY KEY (id),
  CONSTRAINT bids_subastaId_fkey FOREIGN KEY (subastaId) REFERENCES public.auctions(id),
  CONSTRAINT bids_itemId_fkey FOREIGN KEY (itemId) REFERENCES public.items(id),
  CONSTRAINT bids_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id),
  CONSTRAINT bids_paymentMethodId_fkey FOREIGN KEY (paymentMethodId) REFERENCES public.payment_methods(id)
);
CREATE TABLE public.catalogos (
  id text NOT NULL,
  descripcion text NOT NULL,
  subastaId text,
  responsableId text NOT NULL,
  CONSTRAINT catalogos_pkey PRIMARY KEY (id),
  CONSTRAINT catalogos_subastaId_fkey FOREIGN KEY (subastaId) REFERENCES public.auctions(id),
  CONSTRAINT catalogos_responsableId_fkey FOREIGN KEY (responsableId) REFERENCES public.empleados(id)
);
CREATE TABLE public.certified_checks (
  id text NOT NULL,
  paymentMethodId text NOT NULL,
  banco text NOT NULL,
  numeroCheque text NOT NULL,
  monto numeric NOT NULL,
  montoDisponible numeric NOT NULL,
  fechaVencimiento timestamp without time zone NOT NULL,
  verificadoEn timestamp without time zone,
  CONSTRAINT certified_checks_pkey PRIMARY KEY (id),
  CONSTRAINT certified_checks_paymentMethodId_fkey FOREIGN KEY (paymentMethodId) REFERENCES public.payment_methods(id)
);
CREATE TABLE public.consignment_inspections (
  id text NOT NULL,
  consignmentId text NOT NULL,
  resultado USER-DEFINED NOT NULL,
  motivoRechazo text,
  valorBaseAsignado numeric,
  comisionPorcentaje numeric,
  fechaSubastaEstimada timestamp without time zone,
  userAcepta boolean,
  respondidoEn timestamp without time zone,
  costoDevolucion numeric,
  CONSTRAINT consignment_inspections_pkey PRIMARY KEY (id),
  CONSTRAINT consignment_inspections_consignmentId_fkey FOREIGN KEY (consignmentId) REFERENCES public.consignments(id)
);
CREATE TABLE public.consignment_items (
  id text NOT NULL,
  consignmentId text NOT NULL,
  itemId text NOT NULL,
  CONSTRAINT consignment_items_pkey PRIMARY KEY (id),
  CONSTRAINT consignment_items_consignmentId_fkey FOREIGN KEY (consignmentId) REFERENCES public.consignments(id),
  CONSTRAINT consignment_items_itemId_fkey FOREIGN KEY (itemId) REFERENCES public.items(id)
);
CREATE TABLE public.consignment_locations (
  id text NOT NULL,
  consignmentId text NOT NULL,
  depositId text NOT NULL,
  sector text,
  fechaIngreso timestamp without time zone NOT NULL,
  fechaEgreso timestamp without time zone,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT consignment_locations_pkey PRIMARY KEY (id),
  CONSTRAINT consignment_locations_consignmentId_fkey FOREIGN KEY (consignmentId) REFERENCES public.consignments(id),
  CONSTRAINT consignment_locations_depositId_fkey FOREIGN KEY (depositId) REFERENCES public.deposits(id)
);
CREATE TABLE public.consignment_photos (
  id text NOT NULL,
  consignmentId text NOT NULL,
  url text NOT NULL,
  orden integer NOT NULL,
  CONSTRAINT consignment_photos_pkey PRIMARY KEY (id),
  CONSTRAINT consignment_photos_consignmentId_fkey FOREIGN KEY (consignmentId) REFERENCES public.consignments(id)
);
CREATE TABLE public.consignment_specs (
  id text NOT NULL,
  consignmentId text NOT NULL,
  clave text NOT NULL,
  valor text NOT NULL,
  CONSTRAINT consignment_specs_pkey PRIMARY KEY (id),
  CONSTRAINT consignment_specs_consignmentId_fkey FOREIGN KEY (consignmentId) REFERENCES public.consignments(id)
);
CREATE TABLE public.consignments (
  id text NOT NULL,
  userId text NOT NULL,
  descripcion text NOT NULL,
  categoria text,
  valorEstimado numeric,
  esCompuesto boolean NOT NULL DEFAULT false,
  esObraArte boolean NOT NULL DEFAULT false,
  artistaDisenador text,
  fechaCreacionObra timestamp without time zone,
  historia text,
  declaraTitularidad boolean NOT NULL DEFAULT false,
  aceptaDevolucionConCargo boolean NOT NULL DEFAULT false,
  estado USER-DEFINED NOT NULL DEFAULT 'en_evaluacion'::"ConsignmentStatus",
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT consignments_pkey PRIMARY KEY (id),
  CONSTRAINT consignments_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id)
);
CREATE TABLE public.credit_cards (
  id text NOT NULL,
  paymentMethodId text NOT NULL,
  ultimosCuatro text NOT NULL,
  marca text NOT NULL,
  titular text NOT NULL,
  mesVencimiento integer NOT NULL,
  anioVencimiento integer NOT NULL,
  CONSTRAINT credit_cards_pkey PRIMARY KEY (id),
  CONSTRAINT credit_cards_paymentMethodId_fkey FOREIGN KEY (paymentMethodId) REFERENCES public.payment_methods(id)
);
CREATE TABLE public.deposits (
  id text NOT NULL,
  nombre text NOT NULL,
  direccion text NOT NULL,
  ciudad text,
  pais text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  numeroPaisId integer,
  CONSTRAINT deposits_pkey PRIMARY KEY (id),
  CONSTRAINT deposits_numeroPaisId_fkey FOREIGN KEY (numeroPaisId) REFERENCES public.paises(numero)
);
CREATE TABLE public.empleados (
  id text NOT NULL,
  documento text NOT NULL,
  nombre text NOT NULL,
  direccion text,
  cargo text,
  sectorId text,
  CONSTRAINT empleados_pkey PRIMARY KEY (id),
  CONSTRAINT empleados_sectorId_fkey FOREIGN KEY (sectorId) REFERENCES public.sectores(id)
);
CREATE TABLE public.insurance_policies (
  id text NOT NULL,
  numeroPoliza text NOT NULL,
  compania text NOT NULL,
  telefonoCompania text,
  emailCompania text,
  beneficiarioUserId text NOT NULL,
  valorAsegurado numeric NOT NULL,
  fechaInicio timestamp without time zone NOT NULL,
  fechaVencimiento timestamp without time zone NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  polizaCombinada boolean,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT insurance_policies_pkey PRIMARY KEY (id),
  CONSTRAINT insurance_policies_beneficiarioUserId_fkey FOREIGN KEY (beneficiarioUserId) REFERENCES public.users(id)
);
CREATE TABLE public.insurance_policy_consignments (
  id text NOT NULL,
  policyId text NOT NULL,
  consignmentId text NOT NULL,
  CONSTRAINT insurance_policy_consignments_pkey PRIMARY KEY (id),
  CONSTRAINT insurance_policy_consignments_policyId_fkey FOREIGN KEY (policyId) REFERENCES public.insurance_policies(id),
  CONSTRAINT insurance_policy_consignments_consignmentId_fkey FOREIGN KEY (consignmentId) REFERENCES public.consignments(id)
);
CREATE TABLE public.item_components (
  id text NOT NULL,
  itemPadreId text NOT NULL,
  descripcion text NOT NULL,
  orden integer NOT NULL,
  CONSTRAINT item_components_pkey PRIMARY KEY (id),
  CONSTRAINT item_components_itemPadreId_fkey FOREIGN KEY (itemPadreId) REFERENCES public.items(id)
);
CREATE TABLE public.item_images (
  id text NOT NULL,
  itemId text NOT NULL,
  url text NOT NULL,
  orden integer NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT item_images_pkey PRIMARY KEY (id),
  CONSTRAINT item_images_itemId_fkey FOREIGN KEY (itemId) REFERENCES public.items(id)
);
CREATE TABLE public.item_previous_owners (
  id text NOT NULL,
  itemId text NOT NULL,
  nombre text NOT NULL,
  periodo text,
  descripcion text,
  orden integer NOT NULL,
  CONSTRAINT item_previous_owners_pkey PRIMARY KEY (id),
  CONSTRAINT item_previous_owners_itemId_fkey FOREIGN KEY (itemId) REFERENCES public.items(id)
);
CREATE TABLE public.items (
  id text NOT NULL,
  numeroPieza text NOT NULL,
  descripcion text NOT NULL,
  precioBase numeric NOT NULL,
  duenUserId text,
  duenNombreExterno text,
  subastaId text,
  estado USER-DEFINED NOT NULL DEFAULT 'pendiente'::"ItemStatus",
  esCompuesto boolean NOT NULL DEFAULT false,
  esObraArte boolean NOT NULL DEFAULT false,
  artistaDisenador text,
  fechaCreacionObra timestamp without time zone,
  historia text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  catalogoId text,
  comision numeric,
  descripcionCatalogo text,
  descripcionCompleta text,
  disponible boolean,
  fecha timestamp without time zone,
  revisorId text,
  seguroId text,
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT items_duenUserId_fkey FOREIGN KEY (duenUserId) REFERENCES public.users(id),
  CONSTRAINT items_subastaId_fkey FOREIGN KEY (subastaId) REFERENCES public.auctions(id),
  CONSTRAINT items_seguroId_fkey FOREIGN KEY (seguroId) REFERENCES public.insurance_policies(id),
  CONSTRAINT items_revisorId_fkey FOREIGN KEY (revisorId) REFERENCES public.empleados(id),
  CONSTRAINT items_catalogoId_fkey FOREIGN KEY (catalogoId) REFERENCES public.catalogos(id)
);
CREATE TABLE public.notifications (
  id text NOT NULL,
  userId text NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  cuerpo text NOT NULL,
  leida boolean NOT NULL DEFAULT false,
  leidaEn timestamp without time zone,
  metadata jsonb,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id)
);
CREATE TABLE public.paises (
  numero integer NOT NULL,
  nombre text NOT NULL,
  nombreCorto text,
  capital text NOT NULL,
  nacionalidad text NOT NULL,
  idiomas text NOT NULL,
  CONSTRAINT paises_pkey PRIMARY KEY (numero)
);
CREATE TABLE public.payment_methods (
  id text NOT NULL,
  userId text NOT NULL,
  tipo USER-DEFINED NOT NULL,
  estado USER-DEFINED NOT NULL DEFAULT 'pendiente'::"PaymentMethodStatus",
  esInternacional boolean NOT NULL DEFAULT false,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id)
);
CREATE TABLE public.payout_accounts (
  id text NOT NULL,
  userId text NOT NULL,
  consignmentId text,
  banco text NOT NULL,
  numeroCuenta text NOT NULL,
  titular text NOT NULL,
  pais text,
  moneda text NOT NULL,
  swiftBic text,
  iban text,
  declaradaEn timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  numeroPaisId integer,
  CONSTRAINT payout_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT payout_accounts_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id),
  CONSTRAINT payout_accounts_consignmentId_fkey FOREIGN KEY (consignmentId) REFERENCES public.consignments(id),
  CONSTRAINT payout_accounts_numeroPaisId_fkey FOREIGN KEY (numeroPaisId) REFERENCES public.paises(numero)
);
CREATE TABLE public.penalties (
  id text NOT NULL,
  userId text NOT NULL,
  purchaseId text NOT NULL,
  monto numeric NOT NULL,
  estado USER-DEFINED NOT NULL DEFAULT 'pendiente'::"PenaltyStatus",
  fechaLimite timestamp without time zone NOT NULL,
  pagadaEn timestamp without time zone,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT penalties_pkey PRIMARY KEY (id),
  CONSTRAINT penalties_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id),
  CONSTRAINT penalties_purchaseId_fkey FOREIGN KEY (purchaseId) REFERENCES public.purchases(id)
);
CREATE TABLE public.purchases (
  id text NOT NULL,
  itemId text NOT NULL,
  subastaId text NOT NULL,
  compradorUserId text NOT NULL,
  bidId text NOT NULL,
  paymentMethodId text NOT NULL,
  montoFinal numeric NOT NULL,
  comision numeric NOT NULL DEFAULT 0,
  costoEnvio numeric NOT NULL DEFAULT 0,
  retiroPersonal boolean NOT NULL DEFAULT false,
  estadoPago USER-DEFINED NOT NULL DEFAULT 'pendiente'::"PurchasePaymentStatus",
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT purchases_pkey PRIMARY KEY (id),
  CONSTRAINT purchases_itemId_fkey FOREIGN KEY (itemId) REFERENCES public.items(id),
  CONSTRAINT purchases_subastaId_fkey FOREIGN KEY (subastaId) REFERENCES public.auctions(id),
  CONSTRAINT purchases_compradorUserId_fkey FOREIGN KEY (compradorUserId) REFERENCES public.users(id),
  CONSTRAINT purchases_bidId_fkey FOREIGN KEY (bidId) REFERENCES public.bids(id),
  CONSTRAINT purchases_paymentMethodId_fkey FOREIGN KEY (paymentMethodId) REFERENCES public.payment_methods(id)
);
CREATE TABLE public.sectores (
  id text NOT NULL,
  nombreSector text NOT NULL,
  codigoSector text,
  responsableSectorId text,
  CONSTRAINT sectores_pkey PRIMARY KEY (id),
  CONSTRAINT sectores_responsableSectorId_fkey FOREIGN KEY (responsableSectorId) REFERENCES public.empleados(id)
);
CREATE TABLE public.users (
  id text NOT NULL,
  email text NOT NULL,
  passwordHash text,
  nombre text NOT NULL,
  apellido text NOT NULL,
  domicilio text NOT NULL,
  fotoDocFrenteUrl text,
  fotoDocDorsoUrl text,
  categoria USER-DEFINED,
  estado USER-DEFINED NOT NULL DEFAULT 'pendiente_verificacion'::"UserStatus",
  registroCompletado boolean NOT NULL DEFAULT false,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  admitido boolean,
  calificacionRiesgo integer,
  documento text,
  fotoPerfilUrl text,
  numeroPais integer,
  verificacionFinanciera boolean,
  verificacionJudicial boolean,
  verificadorId text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_numeroPais_fkey FOREIGN KEY (numeroPais) REFERENCES public.paises(numero),
  CONSTRAINT users_verificadorId_fkey FOREIGN KEY (verificadorId) REFERENCES public.empleados(id)
);