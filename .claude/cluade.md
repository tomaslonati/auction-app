# Prompt — Sistema de Subastas (Backend + API)

## Contexto del proyecto

Estás trabajando en `auction-app`, una aplicación de subastas online. El repo ya está inicializado.
Tu tarea es construir **únicamente el backend**: schema de Prisma, migraciones, API routes de Next.js y documentación Swagger.

**No desarrollar nada de frontend en esta iteración.** La única excepción es `app/swagger/page.tsx` para poder ver la documentación.

---

## Stack

- **Framework**: Next.js 14+ con App Router
- **ORM**: Prisma
- **Base de datos**: Supabase (PostgreSQL) — proyecto ya creado
- **Autenticación**: Supabase Auth + middleware de Next.js
- **Documentación**: Swagger UI (`swagger-ui-react` + `next-swagger-doc`)
- **Validación de body**: `zod` en todos los endpoints de escritura
- **Mobile (solo referencia, no construir ahora)**: React Native + Expo

---

## Variables de entorno

Crea (o completa) el archivo `.env.local`:

```env
# Prisma — pooled (runtime)
DATABASE_URL="postgresql://postgres.evddzihqfxdahurxhztb:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Prisma — direct (migrations)
DIRECT_URL="postgresql://postgres.evddzihqfxdahurxhztb:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://evddzihqfxdahurxhztb.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key>"
SUPABASE_SERVICE_ROLE_KEY="<service role key>"

# Resend (transactional email)
RESEND_API_KEY="re_LKPyzsoK_BygnNT7CtuVJJwXi9ZvJfJNC"
```

---

## Paso 1 — Instalar dependencias

**Solo instalar. No crear archivos todavía.**

```bash
npm install @prisma/client @supabase/supabase-js @supabase/ssr
npm install swagger-ui-react next-swagger-doc
npm install zod
npm install resend
npm install --save-dev prisma @types/swagger-ui-react
```

---

## Paso 2 — Schema de Prisma (`prisma/schema.prisma`)

### Enums

```prisma
// Orden de jerarquía: comun(1) < especial(2) < plata(3) < oro(4) < platino(5)
// Este orden se usa para validar acceso: categoria_usuario >= categoria_subasta
enum UserCategory    { comun especial plata oro platino }
enum UserStatus      { pendiente_verificacion aprobado multado bloqueado proceso_judicial }
enum AuctionCategory { comun especial plata oro platino }
enum AuctionStatus   { programada activa finalizada cancelada }
enum AuctionCurrency { pesos dolares }
enum ItemStatus      { pendiente en_subasta vendido sin_postor }
enum PaymentMethodType   { cuenta_bancaria tarjeta_credito cheque_certificado }
enum PaymentMethodStatus { pendiente verificado rechazado expirado }
enum BidStatus            { enviada confirmada superada rechazada }
enum ConsignmentStatus    { en_evaluacion aceptado rechazado en_deposito subastado vendido }
enum InspectionResult     { aceptado rechazado }
enum PurchasePaymentStatus { pendiente pagado vencido judicial }
enum PenaltyStatus         { pendiente pagada derivada_justicia }
```

### Modelos (crear en este orden para respetar FK)

1. **User** — tabla `users`
   - `id` UUID PK, `email @unique`, `passwordHash`, `nombre`, `apellido`, `domicilio`, `paisOrigen`
   - `fotoDocFrenteUrl?`, `fotoDocDorsoUrl?`
   - `categoria UserCategory?` — asignada por la empresa tras verificación externa
   - `estado UserStatus @default(pendiente_verificacion)`
   - `registroCompletado Boolean @default(false)` — true recién cuando completa paso 2 y tiene al menos 1 medio de pago
   - timestamps

2. **PaymentMethod** — tabla `payment_methods`
   - `userId → User`, `tipo PaymentMethodType`, `estado PaymentMethodStatus @default(pendiente)`, `esInternacional Boolean @default(false)`, timestamps

3. **BankAccount** — tabla `bank_accounts` (relación 1-a-1 con PaymentMethod)
   - `banco`, `numeroCuenta`, `titular`, `pais`, `moneda`, `swiftBic?`, `iban?`, `fondosReservados Decimal @default(0)`

4. **CreditCard** — tabla `credit_cards` (relación 1-a-1 con PaymentMethod)
   - `ultimosCuatro`, `marca`, `titular`, `mesVencimiento Int`, `anioVencimiento Int`

5. **CertifiedCheck** — tabla `certified_checks` (relación 1-a-1 con PaymentMethod)
   - `banco`, `numeroCheque`, `monto Decimal`, `montoDisponible Decimal`, `fechaVencimiento DateTime`, `verificadoEn DateTime?`
   - Nota: `montoDisponible` se descuenta con cada compra y no puede quedar negativo.

6. **Auctioneer** — tabla `auctioneers`
   - `nombre`, `apellido`, `matricula? @unique`, `createdAt`

7. **Auction** — tabla `auctions`
   - `nombre`, `descripcion?`, `fechaInicio DateTime`, `fechaFin DateTime?`
   - `categoria AuctionCategory`, `estado AuctionStatus @default(programada)`, `moneda AuctionCurrency`
   - `rematadorId? → Auctioneer`, `ubicacion?`
   - timestamps

8. **Item** — tabla `items`
   - `numeroPieza`, `descripcion`, `precioBase Decimal`
   - `duenUserid? → User`, `duenNombreExterno?` — al menos uno requerido (CHECK constraint)
   - `subastaId? → Auction`, `estado ItemStatus @default(pendiente)`
   - `esCompuesto Boolean @default(false)`, `esObraArte Boolean @default(false)`
   - `artistaDisenador?`, `fechaCreacionObra?`, `historia?`
   - timestamps

9. **ItemComponent** — tabla `item_components`
   - Subpiezas de un ítem compuesto. `itemPadreId → Item (cascade delete)`, `descripcion`, `orden Int`

10. **ItemPreviousOwner** — tabla `item_previous_owners`
    - Dueños anteriores (para obras de arte). `itemId → Item`, `nombre`, `periodo?`, `descripcion?`, `orden Int`

11. **ItemImage** — tabla `item_images`
    - `itemId → Item (cascade delete)`, `url`, `orden Int`

12. **AuctionSession** — tabla `auction_sessions`
    - Conexión activa de un usuario a una subasta.
    - `userId → User`, `auctionId → Auction`, `connectedAt`, `disconnectedAt?`
    - Un usuario solo puede tener UNA sesión sin `disconnectedAt` en todo el sistema.

13. **Bid** — tabla `bids`
    - `subastaId → Auction`, `itemId → Item`, `userId → User`, `paymentMethodId → PaymentMethod`
    - `monto Decimal`, `estado BidStatus @default(enviada)`, `createdAt`
    - Índice en `(itemId, createdAt DESC)` para recuperar la última oferta eficientemente.

14. **Purchase** — tabla `purchases`
    - Se crea al adjudicar un ítem (última puja confirmada o compra por la empresa).
    - `itemId @unique`, `subastaId`, `compradorUserId → User`, `bidId? @unique` (null si la empresa compra sin postor)
    - `paymentMethodId? → PaymentMethod`, `montoFinal Decimal`, `comision Decimal @default(0)`
    - `costoEnvio Decimal @default(0)`, `retiroPersonal Boolean @default(false)`
    - `estadoPago PurchasePaymentStatus @default(pendiente)`, timestamps
    - Nota: cuando `retiroPersonal = true` el ítem pierde cobertura del seguro.

15. **Penalty** — tabla `penalties`
    - Multa por incumplimiento de pago. 10% del monto ofertado.
    - `userId → User`, `purchaseId → Purchase`, `monto Decimal`
    - `estado PenaltyStatus @default(pendiente)`, `fechaLimite DateTime` (72 hs desde la adjudicación), `pagadaEn?`

16. **Consignment** — tabla `consignments`
    - Solicitud de un usuario para poner un bien en subasta.
    - `userId → User`, `descripcion`, `categoria?`, `valorEstimado?`
    - `esCompuesto Boolean @default(false)`, `esObraArte Boolean @default(false)`
    - `artistaDisenador?`, `fechaCreacionObra?`, `historia?`
    - `declaraTitularidad Boolean @default(false)` — checkbox obligatorio
    - `aceptaDevolucionConCargo Boolean @default(false)` — checkbox obligatorio
    - `estado ConsignmentStatus @default(en_evaluacion)`, timestamps

17. **ConsignmentItem** — tabla `consignment_items`
    - Join entre `Consignment` y `Item`. Una consignación puede generar N ítems (caso "colección").
    - `@@unique([consignmentId, itemId])`

18. **ConsignmentPhoto** — tabla `consignment_photos`
    - `consignmentId → Consignment (cascade delete)`, `url`, `orden Int`

19. **ConsignmentInspection** — tabla `consignment_inspections` (1-a-1 con Consignment)
    - `resultado InspectionResult`, `motivoRechazo?`, `valorBaseAsignado? Decimal`, `comisionPorcentaje? Decimal`
    - `fechaSubastaEstimada?`, `userAcepta Boolean?` (null = sin respuesta), `respondidoEn?`
    - `costoDevolucion? Decimal` — se informa al usuario si rechaza o es rechazado

20. **Deposit** — tabla `deposits`
    - Depósitos físicos donde se guardan los bienes consignados.
    - `nombre`, `direccion`, `ciudad?`, `pais`

21. **ConsignmentLocation** — tabla `consignment_locations` (1-a-1 con Consignment)
    - `consignmentId → Consignment`, `depositId → Deposit`, `sector?`, `fechaIngreso`, `fechaEgreso?`

22. **InsurancePolicy** — tabla `insurance_policies`
    - Una póliza puede cubrir varias piezas del mismo dueño (M-N con Consignment).
    - `numeroPoliza @unique`, `compania`, `telefonoCompania?`, `emailCompania?`
    - `beneficiarioUserId → User`, `valorAsegurado Decimal`, `fechaInicio`, `fechaVencimiento`

23. **InsurancePolicyConsignment** — tabla `insurance_policy_consignments`
    - Join M-N: `policyId → InsurancePolicy`, `consignmentId → Consignment`
    - `@@unique([policyId, consignmentId])`

24. **PayoutAccount** — tabla `payout_accounts`
    - Cuenta donde el vendedor recibe la liquidación. **Debe declararse antes del inicio de la subasta.**
    - `userId → User`, `consignmentId? → Consignment`
    - `banco`, `numeroCuenta`, `titular`, `pais`, `moneda`, `swiftBic?`, `iban?`, `declaradaEn DateTime @default(now())`

25. **Notification** — tabla `notifications`
    - Mensajes privados internos al usuario (adjudicaciones, multas, cambios de estado, etc.).
    - `userId → User (cascade delete)`, `tipo String`, `titulo`, `cuerpo`, `leida Boolean @default(false)`, `leidaEn?`, `metadata Json?`

---

## Paso 3 — Estructura de carpetas

```
app/
  api/
    swagger/
      route.ts                      (GET — devuelve el JSON de la spec OpenAPI)
    auth/
      register/
        step1/route.ts              (POST — datos personales + fotos de documento)
        status/route.ts             (GET — estado de verificación del registro)
        complete/route.ts           (POST — crear contraseña, finalizar registro)
      login/route.ts                (POST)
      logout/route.ts               (POST)
      password/
        forgot/route.ts             (POST)
        reset/route.ts              (POST)
    users/
      me/
        route.ts                    (GET perfil, PUT actualizar datos, DELETE cuenta)
        password/route.ts           (PUT cambiar contraseña)
        payment-methods/
          route.ts                  (GET listar)
          bank-account/route.ts     (POST registrar cuenta bancaria)
          credit-card/route.ts      (POST registrar tarjeta de crédito)
          certified-check/route.ts  (POST registrar cheque certificado)
          [id]/route.ts             (GET detalle, DELETE eliminar)
        participations/
          route.ts                  (GET historial de subastas con filtros)
          [auctionId]/route.ts      (GET detalle cronológico de participación en una subasta)
        metrics/route.ts            (GET métricas personales)
        notifications/
          route.ts                  (GET listar notificaciones)
          [id]/
            read/route.ts           (PATCH marcar como leída)
        penalties/
          route.ts                  (GET listar multas)
          [id]/
            pay/route.ts            (POST pagar multa)
    auctions/
      route.ts                      (GET listar subastas — público sin precio base, auth con precio base)
      [id]/
        route.ts                    (GET detalle de subasta)
        catalog/
          route.ts                  (GET listar ítems del catálogo con filtros)
          [itemId]/
            route.ts                (GET detalle completo de una pieza)
            bids/route.ts           (GET historial de pujas de ese ítem, ordenado)
        join/route.ts               (POST ingresar a la sala de subasta)
        leave/route.ts              (POST abandonar la sala)
        bids/route.ts               (POST realizar una puja)
        current-item/route.ts       (GET ítem actualmente en subasta + mayor oferta)
    purchases/
      [id]/
        route.ts                    (GET detalle de una compra)
        pickup/route.ts             (PATCH declarar retiro personal — anula cobertura del seguro)
    consignments/
      route.ts                      (GET listar propios, POST crear paso 1)
      [id]/
        route.ts                    (GET detalle)
        photos/route.ts             (POST subir fotos — mínimo 6 requeridas)
        declaration/route.ts        (POST enviar declaración jurada — finaliza la solicitud)
        inspection-response/route.ts (POST aceptar o rechazar condiciones post-inspección)
        payout-account/route.ts     (POST declarar cuenta de cobro — debe ser antes del inicio de subasta)
        insurance/route.ts          (GET datos de la póliza + info de contacto de la aseguradora)
        location/route.ts           (GET ubicación del bien en depósito)
    admin/
      auctions/
        [id]/
          items/
            [itemId]/
              adjudicate/route.ts   (POST cerrar puja de un ítem — crea Purchase, notifica ganador)
      consignments/
        [id]/
          inspect/route.ts          (POST registrar resultado de inspección)
          assign-auction/route.ts   (POST asignar bien a una subasta una vez aceptado)
      payment-methods/
        [id]/
          verify/route.ts           (PATCH cambiar estado a verificado/rechazado)
      users/
        [id]/
          category/route.ts         (PATCH asignar o actualizar categoría del usuario)
lib/
  prisma.ts                         (singleton PrismaClient)
  supabase/
    server.ts                       (createServerClient de @supabase/ssr)
    client.ts                       (createBrowserClient)
  auth.ts                           (requireAuth — extrae y verifica el JWT de Supabase)
  category.ts                       (helper: CATEGORY_RANK map y canAccessAuction())
  email.ts                          (helper: instancia de Resend + funciones de envío tipadas)
  swagger.ts                        (spec OpenAPI 3.0)
middleware.ts
app/
  swagger/
    page.tsx                        (única página — renderiza SwaggerUI)
```

---

## Paso 4 — Autenticación y middleware

- Usa **Supabase Auth** (JWT) para autenticar todos los requests.
- `lib/auth.ts`: función `requireAuth(request)` que extrae el Bearer token, lo verifica con `supabase.auth.getUser(token)` y retorna `{ userId }` o lanza 401.
- `lib/auth.ts`: función `requireAdmin(request)` para las rutas `/api/admin/**` — verifica rol admin en los metadatos del usuario de Supabase.
- `middleware.ts`: proteger todas las rutas `/api/**` excepto:
  - `GET /api/auctions` (listado público)
  - `POST /api/auth/login`
  - `POST /api/auth/register/step1`
  - `GET /api/swagger`
- Usuarios con `estado = proceso_judicial` deben recibir 403 en **cualquier** endpoint autenticado, no solo en los de subastas.

---

## Paso 5 — Reglas de negocio por endpoint

### Jerarquía de categorías

Crear `lib/category.ts` con:
```ts
const CATEGORY_RANK = { comun: 1, especial: 2, plata: 3, oro: 4, platino: 5 }
// acceso: CATEGORY_RANK[user.categoria] >= CATEGORY_RANK[auction.categoria]
```

---

### Auth — Registro (`POST /api/auth/register/step1`)
- Recibe: nombre, apellido, domicilio, paisOrigen, fotoDocFrenteUrl, fotoDocDorsoUrl.
- Crea el usuario en Supabase Auth y en la tabla `users` con `estado = pendiente_verificacion`.

### Email con Resend

Crear `lib/email.ts` con la instancia del cliente y una función tipada por cada email transaccional:

```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendRegistrationApprovedEmail(to: string, nombre: string) {
  return resend.emails.send({
    from: 'subastas@tudominio.com',   // reemplazar con el dominio verificado en Resend
    to,
    subject: 'Tu registro fue aprobado — completá tu cuenta',
    html: `
      <p>Hola ${nombre},</p>
      <p>Tu solicitud de registro fue aprobada. Ingresá a la app para crear tu contraseña y completar el registro.</p>
    `,
  })
}
```

Este email se dispara **únicamente** desde `PATCH /api/admin/users/{id}/category` cuando el estado del usuario pasa a `aprobado` por primera vez (es decir, cuando `registroCompletado = false` y `categoria` se asigna por primera vez). Es el único email transaccional del sistema por ahora.

### Auth — Completar registro (`POST /api/auth/register/complete`)
- Solo permitido si `estado = aprobado` y `registroCompletado = false`.
- Recibe: password. Actualiza la contraseña en Supabase Auth.
- **No marcar `registroCompletado = true` todavía**: eso ocurre cuando el usuario registra al menos 1 medio de pago verificado.

### Auth — Estado de verificación (`GET /api/auth/register/status`)
- Retorna el `estado` actual del usuario y si ya completó el registro.

---

### Medios de pago

**`POST /api/users/me/payment-methods/bank-account`**
- Crea `PaymentMethod` (tipo `cuenta_bancaria`) + `BankAccount`.
- Si la moneda de la cuenta es distinta de ARS o el país es extranjero → `esInternacional = true`.

**`POST /api/users/me/payment-methods/credit-card`**
- Si `esInternacional = true`, puede usarse en subastas en dólares.

**`POST /api/users/me/payment-methods/certified-check`**
- Solo puede registrarse si la subasta aún no comenzó (verificar en el contexto del uso).
- `montoDisponible` se inicializa igual a `monto`.

**`DELETE /api/users/me/payment-methods/{id}`**
- No permitir si hay una `AuctionSession` activa o `Purchase` con `estadoPago = pendiente` que use ese método.

**`PATCH /api/admin/payment-methods/{id}/verify`**
- Cambia `estado` a `verificado` o `rechazado`.
- Si pasa a `verificado` y el usuario ya completó la contraseña → marcar `registroCompletado = true`.

---

### Subastas

**`GET /api/auctions`**
- Sin auth: devuelve subastas con catálogo pero **sin `precioBase`** en los ítems.
- Con auth (cualquier categoría aprobada): incluye `precioBase`.
- Filtros: `estado`, `categoria`, `moneda`, `fechaDesde`, `fechaHasta`.

**`GET /api/auctions/{id}`**
- Igual lógica de visibilidad de `precioBase`.
- Incluye: nombre, descripción, fecha/hora, ubicación, categoría requerida, rematador, moneda, total de ítems en catálogo.
- Indicar si el usuario cumple requisitos para ingresar (categoría + medio de pago verificado).

**`POST /api/auctions/{id}/join`**
- Validar:
  1. Usuario `estado = aprobado` y sin penalties pendientes.
  2. `CATEGORY_RANK[user.categoria] >= CATEGORY_RANK[auction.categoria]`.
  3. No existe otra `AuctionSession` activa del mismo usuario (sin `disconnectedAt`).
- Crea `AuctionSession`. Retorna el ítem actual y la mayor oferta vigente.

**`POST /api/auctions/{id}/leave`**
- Setea `disconnectedAt = now()` en la `AuctionSession` activa del usuario en esa subasta.

**`GET /api/auctions/{id}/current-item`**
- Retorna el ítem con `estado = en_subasta`, la mayor puja confirmada y el `precioBase`.

---

### Pujas

**`POST /api/auctions/{id}/bids`**
- Validaciones en orden:
  1. Usuario tiene sesión activa en esta subasta (`AuctionSession` sin `disconnectedAt`).
  2. Usuario tiene al menos 1 `PaymentMethod` con `estado = verificado`.
  3. El `paymentMethodId` enviado pertenece al usuario y está `verificado`.
  4. **Subasta en dólares**: el medio de pago debe ser `cuenta_bancaria` con `esInternacional = true` o `tarjeta_credito` con `esInternacional = true`. Rechazar cheques certificados en subastas en dólares.
  5. No existe una puja del mismo usuario con `estado = enviada` para este ítem (esperar confirmación).
  6. Calcular `ultimaOferta` = la puja confirmada más alta del ítem (o `precioBase` si no hay pujas).
  7. Validar rango: `ultimaOferta + precioBase * 0.01 ≤ monto ≤ ultimaOferta + precioBase * 0.20`.
     - La restricción del máximo **no aplica** si `auction.categoria` es `oro` o `platino`.
  8. **Cheque certificado**: verificar que `montoDisponible >= monto` en la tabla `certified_checks`.
- Crea la `Bid` con `estado = enviada`.
- Retorna la bid creada. La confirmación (`estado = confirmada`) la dispara el endpoint de admin `adjudicate` o un proceso interno.

**`GET /api/auctions/{id}/catalog/{itemId}/bids`**
- Lista todas las pujas del ítem en orden cronológico ascendente. Incluye usuario (nombre/apellido) y monto.

---

### Adjudicación (admin)

**`POST /api/admin/auctions/{id}/items/{itemId}/adjudicate`**
- Cierra la puja del ítem actual. Solo si `auction.estado = activa` e `item.estado = en_subasta`.
- **Si hay pujas confirmadas**:
  1. Tomar la de mayor monto.
  2. Crear `Purchase` con `montoFinal`, `comision` y `costoEnvio`.
  3. Marcar `item.estado = vendido`, actualizar `duenUserid` al comprador.
  4. Descontar `montoDisponible` en `CertifiedCheck` si corresponde.
  5. Crear `Notification` para el ganador con detalle del importe, comisiones y costo de envío.
  6. Crear `Notification` para los no ganadores indicando que el ítem fue adjudicado a otro postor.
- **Si no hay pujas**: crear `Purchase` sin `compradorUserId` ni `bidId` (la empresa compra al `precioBase`). Marcar `item.estado = sin_postor`.
- Actualizar el siguiente ítem del catálogo a `estado = en_subasta`.

---

### Compras

**`GET /api/purchases/{id}`**
- Devuelve detalle: ítem, monto, comisión, costo de envío, estado de pago, medio de pago usado.

**`PATCH /api/purchases/{id}/pickup`**
- Declara retiro personal (`retiroPersonal = true`).
- **Al activar**: registrar que el bien pierde cobertura del seguro (actualizar la póliza o agregar nota). Solo puede hacerse si `estadoPago = pagado`.

---

### Multas y bloqueos

**`GET /api/users/me/penalties`**
- Lista multas del usuario con estado, monto y fecha límite de pago.

**`POST /api/users/me/penalties/{id}/pay`**
- Registra el pago de la multa (`estado = pagada`, `pagadaEn = now()`).
- Si el usuario no tenía otras penalties pendientes, puede volver a participar en subastas.
- **No aplica automáticamente**: es responsabilidad del admin marcar el `Purchase` como `vencido` → `judicial` y actualizar el `User.estado` según corresponda.

**`PATCH /api/admin/users/{id}/category`**
- Asigna o actualiza la categoría del usuario post-verificación externa.
- Si `estado` pasa a `proceso_judicial`: bloquear acceso a todos los servicios de la app (middleware devuelve 403).

---

### Consignación

**`POST /api/consignments`**
- Crea la consignación con datos del bien. Estado inicial: `en_evaluacion`.
- Aceptar campos de obra de arte si `esObraArte = true`.

**`POST /api/consignments/{id}/photos`**
- Adjunta fotos al bien. Mínimo 6 para poder avanzar.

**`POST /api/consignments/{id}/declaration`**
- Envía la declaración jurada y finaliza la solicitud.
- Validar antes de aceptar:
  1. Al menos 6 `ConsignmentPhoto` cargadas.
  2. `declaraTitularidad = true`.
  3. `aceptaDevolucionConCargo = true`.
- Cambia `estado = en_evaluacion` (ya lo estaba, pero confirma el envío formal).

**`POST /api/admin/consignments/{id}/inspect`**
- Registra el resultado de la inspección física (`ConsignmentInspection`).
- Si `resultado = rechazado`: indica motivo y `costoDevolucion`. Estado pasa a `rechazado`. Crear `Notification` al usuario.
- Si `resultado = aceptado`: informa `valorBaseAsignado`, `comisionPorcentaje`, `fechaSubastaEstimada`. Estado pasa a `aceptado`. Crear `Notification` al usuario. Bien pasa a `en_deposito` cuando se registra su ubicación.

**`POST /api/consignments/{id}/inspection-response`**
- El usuario acepta o rechaza las condiciones (valor base + comisiones).
- Si acepta (`userAcepta = true`): el bien queda a la espera de ser asignado a una subasta.
- Si rechaza (`userAcepta = false`): se informa el costo de devolución. Estado pasa a `rechazado`.

**`POST /api/admin/consignments/{id}/assign-auction`**
- Asigna el bien consignado (aceptado por el usuario) a una subasta futura. Crea el `Item` correspondiente y la relación en `ConsignmentItem`. Estado pasa a `subastado`.
- Si hay muchos artículos del mismo dueño y la empresa decide agruparlos, se puede crear una subasta nueva con el nombre "Colección {apellido del usuario}" y asignar todos allí.

**`POST /api/consignments/{id}/payout-account`**
- Declara la cuenta bancaria donde el vendedor recibirá la liquidación.
- Validar que la `Auction` asignada al bien aún no haya comenzado (`fechaInicio > now()`). Si ya comenzó, rechazar con 422.

**`GET /api/consignments/{id}/insurance`**
- Devuelve la póliza de seguro (compañía, número, valor asegurado, vencimiento) y los datos de contacto de la aseguradora (`telefonoCompania`, `emailCompania`) para que el usuario pueda comunicarse para aumentar el valor asegurado. El aumento de la póliza es externo a la app; solo se muestra el contacto.

**`GET /api/consignments/{id}/location`**
- Devuelve el depósito donde está almacenado el bien (nombre, dirección, sector).

---

### Historial y métricas

**`GET /api/users/me/participations`**
- Historial de subastas en las que participó. Filtros: fecha, categoría, resultado (ganó/perdió/participó).
- Resumen rápido: total subastas, ítems ganados, importe total pagado.

**`GET /api/users/me/participations/{auctionId}`**
- Lista de ítems en los que participó dentro de esa subasta, con historial de pujas ordenado cronológicamente y resultado final (ganó/perdió, oferta final, monto pagado si ganó, comisiones).

**`GET /api/users/me/metrics`**
- Métricas personales:
  - Total de subastas asistidas y ítems ganados.
  - Ratio de éxito: ganadas / participaciones totales.
  - Importes totales ofertados vs. pagados.
  - Desglose por categoría de subasta (comun, especial, plata, oro, platino).
  - Categoría actual y condiciones para subir (más medios de pago o mayor actividad).

---

### Perfil y configuración

**`GET /api/users/me`**
- Datos personales, categoría, estado de cuenta. Si hay multa o bloqueo: motivo y pasos para resolver.

**`PUT /api/users/me`**
- Actualizar domicilio y país. No permite cambiar email ni categoría.

**`DELETE /api/users/me`**
- Solicitud de baja. No eliminar físicamente; marcar con un estado especial. Solo si no tiene `Purchase` con `estadoPago = pendiente`.

---

## Paso 6 — Swagger

- Crear `lib/swagger.ts` con la spec OpenAPI 3.0 usando `next-swagger-doc`.
- `app/api/swagger/route.ts`: devuelve el JSON de la spec.
- `app/swagger/page.tsx`: renderiza `SwaggerUI` apuntando a `/api/swagger`. **Es la única página que se crea.**
- Documentar **todos los endpoints** con: descripción, parámetros de ruta/query, body (JSON Schema vía zod), respuestas (200, 400, 401, 403, 404, 422).
- Tags: `Auth`, `PaymentMethods`, `Auctions`, `Catalog`, `Bids`, `Purchases`, `Consignments`, `Admin`, `History`, `Profile`, `Notifications`.
- El canal WebSocket (`WS /auctions/{id}/live`) documentarlo como un endpoint con nota: *"Se implementará con Supabase Realtime en una iteración posterior. No construir ahora."*

---

## Paso 7 — Migración

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Paso 8 — Convenciones de código

- `lib/prisma.ts`: singleton de PrismaClient (patrón global para hot-reload de Next.js).
- Todas las respuestas con formato `{ data, error, meta? }`.
- Errores de validación: HTTP 422 con array de campos inválidos.
- Validar todos los bodies de escritura con `zod`.
- Rutas `/api/admin/**` requieren rol admin verificado con `requireAdmin()`.

---

## ⚠️ Alcance de esta iteración

| | |
|---|---|
| ✅ | Instalar paquetes |
| ✅ | Prisma schema completo + migración |
| ✅ | Todos los endpoints de la API (`/api/**`) |
| ✅ | Autenticación y middleware |
| ✅ | Swagger (`/api/swagger` + `app/swagger/page.tsx`) |
| ❌ | **Ninguna otra página ni componente de UI** |
| ❌ | **Streaming** (fuera de scope definitivo) |
| ✅ | **Email con Resend** — solo el de aprobación de registro |
| ❌ | **Integración con el sistema legado** (iteración futura) |
| ❌ | **WebSocket / Realtime** (iteración futura con Supabase Realtime) |
