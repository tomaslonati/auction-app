# Auction App — Trabajo Práctico

**Materia:** Desarrollo de Aplicaciones I  
**Universidad:** Universidad Argentina de la Empresa (UADE)

> **Prototipo de diseño (Figma):**  
> [https://www.figma.com/proto/BAhFYZyvahMGuRCJhDhsDI/Auction-app?node-id=76-1113&t=KKLAgwUXJenH8I2J-1](https://www.figma.com/proto/BAhFYZyvahMGuRCJhDhsDI/Auction-app?node-id=76-1113&t=KKLAgwUXJenH8I2J-1)

---

## Descripción del proyecto

Auction App es una plataforma de subastas online desarrollada como trabajo práctico universitario. El sistema permite que usuarios registrados consignen objetos para ser subastados, participen en subastas en vivo realizando pujos, y gestionen sus compras. Un panel de administración permite al personal de la casa de subastas evaluar consignaciones, organizar las subastas, asignar artículos y adjudicar lotes.

### Funcionalidades principales

- **Autenticación:** registro en dos pasos con verificación de identidad (foto de documento), login/logout, recuperación y cambio de contraseña, envío de emails transaccionales.
- **Perfil de usuario:** datos personales, métodos de pago (cuenta bancaria, tarjeta de crédito, cheque certificado), historial de participaciones, penalidades, notificaciones y pujos activos.
- **Consignaciones:** los usuarios envían artículos con fotos, declaración de titularidad, seguro, ubicación en depósito, cuenta de cobro y especificaciones técnicas. El admin los inspecciona y acepta o rechaza.
- **Subastas:** listado de subastas disponibles según la categoría del usuario, unirse/abandonar una sesión en vivo, ver ítem en curso, realizar y consultar pujos.
- **Compras:** seguimiento del estado de pago y coordinación del retiro del artículo ganado.
- **Admin:** verificar métodos de pago, categorizar usuarios, asignar consignaciones a subastas, adjudicar ítems al mejor postor.
- **API documentada:** interfaz Swagger disponible en `/swagger`.

### Stack tecnológico

- **Next.js 16** (App Router, Route Handlers) — framework principal
- **PostgreSQL** — base de datos relacional
- **Prisma** — ORM para el modelado y las migraciones
- **Supabase** — autenticación y almacenamiento de archivos (fotos)
- **Resend** — envío de emails transaccionales
- **Zod** — validación de esquemas en los endpoints
- **Vitest** — suite de tests unitarios e integración

---

## Requisitos previos

Antes de correr el proyecto es necesario tener instalado en la máquina:

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|---------|
| Node.js | 20 LTS | https://nodejs.org |
| npm | 10+ | incluido con Node.js |
| PostgreSQL | 15+ | https://www.postgresql.org/download |

También se necesitan cuentas y credenciales en los siguientes servicios externos:

- **Supabase** — base de datos y storage: https://supabase.com
- **Resend** — envío de emails: https://resend.com

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd auction-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos PostgreSQL (puede ser la de Supabase o una instancia propia)
DATABASE_URL="postgresql://usuario:contraseña@host:5432/nombre_db"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://<proyecto>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"

# Resend (emails transaccionales)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="no-reply@tudominio.com"
```

### 4. Aplicar migraciones de la base de datos

```bash
npx prisma migrate deploy
```

### 5. (Opcional) Poblar la base de datos con datos de prueba

```bash
npm run seed
```

---

## Correr el proyecto

```bash
npm run dev
```

La aplicación queda disponible en [http://localhost:3000](http://localhost:3000).  
La documentación Swagger de la API queda en [http://localhost:3000/swagger](http://localhost:3000/swagger).

---

## Comandos disponibles

```bash
npm run dev               # servidor de desarrollo con hot-reload
npm run build             # build de producción
npm run start             # servidor de producción (requiere build previo)
npm run lint              # linter
npm test                  # tests unitarios
npm run test:watch        # tests en modo watch (re-corre al guardar)
npm run test:coverage     # reporte de cobertura en /coverage
npm run test:integration  # tests de integración (requiere servidor corriendo en otra terminal)
npm run seed              # poblar la base de datos con datos iniciales
```

---

## Testing

El proyecto usa [Vitest](https://vitest.dev/) para tests unitarios e integrales.

### Tests unitarios

Cubren los route handlers de la API con mocks de Prisma, Supabase y email. No requieren base de datos ni servidor levantado.

```bash
npm test
```

### Tests de integración

Corren contra el servidor real en `http://localhost:3000`. Requieren tener el servidor levantado en otra terminal.

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:integration
```

Algunos tests con token válido leen la variable de entorno `TEST_AUTH_TOKEN`. Si no está definida, esos casos se saltean automáticamente.

### Estructura de tests

```
__tests__/
  setup.ts                  # mocks globales (Prisma, Supabase, email, next/server)
  unit/
    auth/                   # register-step1, register-complete, login, logout, password-*
    users/                  # me, me-password, me-metrics, me-notifications, me-participations,
                            # me-penalties, me-payment-methods, me-active-bids
    auctions/               # auctions, auctions-id, catalog, catalog-item, bids, join, leave,
                            # current-item
    consignments/           # consignments, consignments-id, photos, declaration,
                            # inspection-response, insurance, location, payout-account, specs
    purchases/              # purchases-id, purchases-pickup
    admin/                  # users-category, payment-methods-verify, consignments-inspect,
                            # consignments-assign-auction, auctions-adjudicate
    storage/                # upload-url
  integration/
    auth.integration.test.ts
    auctions.integration.test.ts
```
