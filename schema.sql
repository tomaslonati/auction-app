-- ============================================================
--  TIPOS ENUMERADOS
-- ============================================================

CREATE TYPE user_category AS ENUM
(
  'comun', 'especial', 'plata', 'oro', 'platino'
);

CREATE TYPE user_status AS ENUM
(
  'pendiente_verificacion', 'aprobado', 'multado',
  'bloqueado', 'proceso_judicial'
);

CREATE TYPE auction_category AS ENUM
(
  'comun', 'especial', 'plata', 'oro', 'platino'
);

CREATE TYPE auction_status AS ENUM
(
  'programada', 'activa', 'finalizada', 'cancelada'
);

CREATE TYPE auction_currency AS ENUM
('pesos', 'dolares');

CREATE TYPE item_status AS ENUM
(
  'pendiente', 'en_subasta', 'vendido', 'sin_postor'
);

CREATE TYPE payment_method_type AS ENUM
(
  'cuenta_bancaria', 'tarjeta_credito', 'cheque_certificado'
);

CREATE TYPE payment_method_status AS ENUM
(
  'pendiente', 'verificado', 'rechazado', 'expirado'
);

CREATE TYPE bid_status AS ENUM
(
  'enviada', 'confirmada', 'superada', 'rechazada'
);

CREATE TYPE consignment_status AS ENUM
(
  'en_evaluacion', 'aceptado', 'rechazado',
  'en_deposito', 'subastado', 'vendido'
);

CREATE TYPE inspection_result AS ENUM
('aceptado', 'rechazado');

CREATE TYPE purchase_payment_status AS ENUM
(
  'pendiente', 'pagado', 'vencido', 'judicial'
);

CREATE TYPE penalty_status AS ENUM
(
  'pendiente', 'pagada', 'derivada_justicia'
);


-- ============================================================
--  MÓDULO 1 — USUARIOS Y AUTENTICACIÓN
-- ============================================================

CREATE TABLE users
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    domicilio TEXT NOT NULL,
    pais_origen VARCHAR(100) NOT NULL,
    foto_doc_frente_url TEXT,
    foto_doc_dorso_url TEXT,
    categoria user_category,
    estado user_status NOT NULL DEFAULT 'pendiente_verificacion',
    registro_completado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
--  MÓDULO 2 — MEDIOS DE PAGO
-- ============================================================

CREATE TABLE payment_methods
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo payment_method_type NOT NULL,
    estado payment_method_status NOT NULL DEFAULT 'pendiente',
    es_internacional BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bank_accounts
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_method_id UUID NOT NULL UNIQUE REFERENCES payment_methods(id) ON DELETE CASCADE,
    banco VARCHAR(255) NOT NULL,
    numero_cuenta VARCHAR(100) NOT NULL,
    titular VARCHAR(255) NOT NULL,
    pais VARCHAR(100) NOT NULL,
    moneda VARCHAR(10) NOT NULL,
    swift_bic VARCHAR(20),
    iban VARCHAR(50),
    fondos_reservados NUMERIC(15,2) NOT NULL DEFAULT 0
);

CREATE TABLE credit_cards
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_method_id UUID NOT NULL UNIQUE REFERENCES payment_methods(id) ON DELETE CASCADE,
    ultimos_cuatro VARCHAR(4) NOT NULL,
    marca VARCHAR(50) NOT NULL,
    titular VARCHAR(255) NOT NULL,
    mes_vencimiento SMALLINT NOT NULL CHECK (mes_vencimiento BETWEEN 1 AND 12),
    anio_vencimiento SMALLINT NOT NULL
);

CREATE TABLE certified_checks
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_method_id UUID NOT NULL UNIQUE REFERENCES payment_methods(id) ON DELETE CASCADE,
    banco VARCHAR(255) NOT NULL,
    numero_cheque VARCHAR(100) NOT NULL,
    monto NUMERIC(15,2) NOT NULL,
    monto_disponible NUMERIC(15,2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    verificado_en TIMESTAMPTZ
);


-- ============================================================
--  MÓDULO 3 — SUBASTAS Y CATÁLOGO
-- ============================================================

CREATE TABLE auctioneers
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    matricula VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auctions
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ,
    categoria auction_category NOT NULL,
    estado auction_status NOT NULL DEFAULT 'programada',
    moneda auction_currency NOT NULL,
    rematador_id UUID REFERENCES auctioneers(id),
    ubicacion TEXT,
    streaming_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE items
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_pieza VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    precio_base NUMERIC(15,2) NOT NULL,
    -- dueño: puede ser un usuario del sistema o una persona externa
    dueno_user_id UUID REFERENCES users(id),
    dueno_nombre_externo VARCHAR(255),
    subasta_id UUID REFERENCES auctions(id),
    estado item_status NOT NULL DEFAULT 'pendiente',
    -- ítem compuesto (ej: juego de té de 18 piezas)
    es_compuesto BOOLEAN NOT NULL DEFAULT FALSE,
    -- datos adicionales para obras de arte / diseñador
    es_obra_arte BOOLEAN NOT NULL DEFAULT FALSE,
    artista_disenador VARCHAR(255),
    fecha_creacion_obra DATE,
    historia TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT dueno_check CHECK (
    dueno_user_id IS NOT NULL OR dueno_nombre_externo IS NOT NULL
  )
);

CREATE TABLE item_components
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_padre_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    descripcion VARCHAR(255) NOT NULL,
    orden INT NOT NULL DEFAULT 0
);

CREATE TABLE item_previous_owners
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    periodo VARCHAR(100),
    descripcion TEXT,
    orden INT NOT NULL DEFAULT 0
);

CREATE TABLE item_images
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    orden INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
--  MÓDULO 4 — SALA DE SUBASTA Y PUJAS
-- ============================================================

-- Rastrea qué usuario está conectado a qué subasta en tiempo real
-- (un usuario no puede estar en más de una subasta a la vez)
CREATE TABLE auction_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auction_id UUID NOT NULL REFERENCES auctions(id),
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  disconnected_at TIMESTAMPTZ,
  CONSTRAINT one_active_session_per_user
    EXCLUDE USING gist
(user_id
WITH =)
    WHERE
(disconnected_at IS NULL)
);

CREATE TABLE bids
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subasta_id UUID NOT NULL REFERENCES auctions(id),
    item_id UUID NOT NULL REFERENCES items(id),
    user_id UUID NOT NULL REFERENCES users(id),
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
    monto NUMERIC(15,2) NOT NULL,
    estado bid_status NOT NULL DEFAULT 'enviada',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registro de adjudicación cuando nadie supera la última puja
CREATE TABLE purchases
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL UNIQUE REFERENCES items(id),
    subasta_id UUID NOT NULL REFERENCES auctions(id),
    comprador_user_id UUID NOT NULL REFERENCES users(id),
    bid_id UUID NOT NULL REFERENCES bids(id),
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
    monto_final NUMERIC(15,2) NOT NULL,
    comision NUMERIC(15,2) NOT NULL DEFAULT 0,
    costo_envio NUMERIC(15,2) NOT NULL DEFAULT 0,
    retiro_personal BOOLEAN NOT NULL DEFAULT FALSE,
    estado_pago purchase_payment_status NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE penalties
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    purchase_id UUID NOT NULL REFERENCES purchases(id),
    monto NUMERIC(15,2) NOT NULL,
    estado penalty_status NOT NULL DEFAULT 'pendiente',
    fecha_limite TIMESTAMPTZ NOT NULL,
    -- 72 hs desde la adjudicación
    pagada_en TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
--  MÓDULO 6 — CONSIGNACIÓN DE ARTÍCULOS
-- ============================================================

CREATE TABLE consignments
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    descripcion TEXT NOT NULL,
    categoria VARCHAR(100),
    valor_estimado NUMERIC(15,2),
    es_compuesto BOOLEAN NOT NULL DEFAULT FALSE,
    -- datos adicionales para obras de arte
    es_obra_arte BOOLEAN NOT NULL DEFAULT FALSE,
    artista_disenador VARCHAR(255),
    fecha_creacion_obra DATE,
    historia TEXT,
    -- declaraciones obligatorias del formulario
    declara_titularidad BOOLEAN NOT NULL DEFAULT FALSE,
    acepta_devolucion_con_cargo BOOLEAN NOT NULL DEFAULT FALSE,
    estado consignment_status NOT NULL DEFAULT 'en_evaluacion',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Relación entre consignación e ítems resultantes (1 consignación → N ítems posibles)
CREATE TABLE consignment_items
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consignment_id UUID NOT NULL REFERENCES consignments(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    UNIQUE (consignment_id, item_id)
);

CREATE TABLE consignment_photos
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consignment_id UUID NOT NULL REFERENCES consignments(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    orden INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE consignment_inspections
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consignment_id UUID NOT NULL UNIQUE REFERENCES consignments(id),
    resultado inspection_result NOT NULL,
    motivo_rechazo TEXT,
    valor_base_asignado NUMERIC(15,2),
    comision_porcentaje NUMERIC(5,4),
    fecha_subasta_estimada DATE,
    -- respuesta del usuario (NULL = pendiente)
    user_acepta BOOLEAN,
    respondido_en TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deposits
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100),
    pais VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE consignment_locations
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consignment_id UUID NOT NULL REFERENCES consignments(id),
    deposit_id UUID NOT NULL REFERENCES deposits(id),
    sector VARCHAR(100),
    fecha_ingreso TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_egreso TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE insurance_policies
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_poliza VARCHAR(100) NOT NULL UNIQUE,
    compania VARCHAR(255) NOT NULL,
    beneficiario_user_id UUID NOT NULL REFERENCES users(id),
    valor_asegurado NUMERIC(15,2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Una póliza puede cubrir varias piezas del mismo dueño
CREATE TABLE insurance_policy_consignments
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES insurance_policies(id),
    consignment_id UUID NOT NULL REFERENCES consignments(id),
    UNIQUE (policy_id, consignment_id)
);

-- Cuenta donde el vendedor recibirá el dinero de la subasta
CREATE TABLE payout_accounts
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    consignment_id UUID REFERENCES consignments(id),
    banco VARCHAR(255) NOT NULL,
    numero_cuenta VARCHAR(100) NOT NULL,
    titular VARCHAR(255) NOT NULL,
    pais VARCHAR(100) NOT NULL,
    moneda VARCHAR(10) NOT NULL,
    swift_bic VARCHAR(20),
    iban VARCHAR(50),
    declarada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
--  MÓDULO 7/8 — NOTIFICACIONES
-- ============================================================

CREATE TABLE notifications
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    -- 'adjudicacion' | 'multa' | 'consignacion' | 'subasta' | etc.
    titulo VARCHAR(255) NOT NULL,
    cuerpo TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    leida_en TIMESTAMPTZ,
    metadata JSONB,
    -- datos extra según el tipo
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
--  ÍNDICES RECOMENDADOS
-- ============================================================

CREATE INDEX idx_items_subasta       ON items(subasta_id);
CREATE INDEX idx_bids_item           ON bids(item_id);
CREATE INDEX idx_bids_user           ON bids(user_id);
CREATE INDEX idx_bids_subasta        ON bids(subasta_id);
CREATE INDEX idx_bids_created        ON bids(created_at DESC);
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_consignments_user   ON consignments(user_id);
CREATE INDEX idx_notifications_user  ON notifications(user_id, leida, created_at DESC);
CREATE INDEX idx_auctions_estado     ON auctions(estado, fecha_inicio);