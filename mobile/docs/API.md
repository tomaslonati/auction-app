# Aucty — API Reference

URL base: `http://localhost:3000` (configurable vía `EXPO_PUBLIC_API_URL`)

## Auth

Todos los endpoints protegidos requieren:
```
Authorization: Bearer <supabase_access_token>
```

El token se obtiene automáticamente del cliente Supabase. Usar siempre `api.*` de `lib/api.ts` que lo inyecta solo.

## Respuesta estándar

```typescript
{ data: T | null, error: string | null }
```

Siempre verificar `error !== null` antes de usar `data`.

---

## Auctions

### GET /api/auctions

Lista subastas. Pública (sin token muestra subastas pero sin `precioBase` en items).

**Query params:**
| Param | Tipo | Valores |
|---|---|---|
| `estado` | string | `proxima`, `activa`, `finalizada` |
| `categoria` | string | `comun`, `especial`, `plata`, `oro`, `platino` |
| `moneda` | string | `pesos`, `dolares` |
| `fechaDesde` | ISO date | — |
| `fechaHasta` | ISO date | — |

**Response:**
```typescript
{
  data: Auction[]  // incluye rematador, specs, items (sin precioBase si no auth)
  error: null
}
```

### GET /api/auctions/:id

Detalle de una subasta.

**Response extra vs listado:**
```typescript
{
  data: Auction & {
    canJoin: boolean   // true si el usuario puede unirse (aprobado + tiene medio verificado + categoría suficiente)
  }
}
```

### GET /api/auctions/:id/catalog

Items del catálogo de la subasta.

**Query params:** `estado`, `esObraArte`

**Response:** Array de items. `precioBase` solo si el usuario está autenticado y aprobado.

### GET /api/auctions/:id/current-item

Item actualmente en subasta (requiere auth).

**Response:**
```typescript
{
  data: {
    item: Item & { images: Image[]; components: Item[] }
    highestBid: { monto: number; userId: string } | null
    precioBase: number
  }
}
```

### POST /api/auctions/:id/join

Unirse a una subasta (requiere auth + aprobado + sin penalidades + categoría válida).

**Response:**
```typescript
{
  data: {
    session: AuctionSession
    currentItem: Item | null
    highestBid: Bid | null
  }
}
```

**Errores posibles:**
- `403` — usuario no aprobado, tiene penalidades, o no cumple categoría
- `409` — ya tiene sesión activa

### POST /api/auctions/:id/leave

Abandonar la subasta activa.

### POST /api/auctions/:id/bids

Hacer una puja (requiere sesión activa en la subasta).

**Body:**
```typescript
{
  itemId: string         // UUID del item
  paymentMethodId: string // UUID del método de pago verificado
  monto: number          // monto de la oferta
}
```

**Validaciones del backend:**
- Monto mínimo: `ultimaOferta + precioBase * 0.01`
- Monto máximo: `ultimaOferta + precioBase * 0.20` (excepto categorías `oro` y `platino`)
- Subastas en dólares: solo tarjeta/cuenta internacional

---

## Users

### GET /api/users/me

Perfil del usuario autenticado.

**Response:**
```typescript
{
  data: {
    id: string
    email: string
    nombre: string
    apellido: string
    domicilio: string
    numeroPais: number
    categoria: 'comun' | 'especial' | 'plata' | 'oro' | 'platino'
    estado: 'pendiente_aprobacion' | 'aprobado' | 'rechazado' | 'bloqueado' | 'multado' | 'proceso_judicial'
    registroCompletado: boolean
    fotoPerfilUrl: string | null
    penalties: Array<{ id: string; monto: number; fechaLimite: string }>
  }
}
```

### PUT /api/users/me

Actualizar perfil.

**Body (todos opcionales):**
```typescript
{
  domicilio?: string
  numeroPais?: number
  fotoPerfilUrl?: string    // URL (storage de Supabase)
  fotoDocFrenteUrl?: string // URL
  fotoDocDorsoUrl?: string  // URL
}
```

### DELETE /api/users/me

Eliminar cuenta (bloquea si hay compras pendientes).

### PUT /api/users/me/password

Cambiar contraseña.

**Body:** `{ currentPassword: string; newPassword: string }`

### GET /api/users/me/metrics

Métricas personales.

**Response:**
```typescript
{
  data: {
    categoria: string
    totalSubastas: number
    itemsGanados: number
    ratioExito: number           // 0-1
    totalOfertado: number
    totalPagado: number
    desglosePorCategoria: Record<string, { subastas: number; items: number }>
  }
}
```

### GET /api/users/me/participations

Historial de participaciones.

**Query params:** `fechaDesde`, `fechaHasta`, `categoria`, `resultado` (gano | perdio | participo)

**Response:**
```typescript
{
  data: {
    participations: Array<{
      auction: Auction
      bidCount: number
      itemsGanados: number
      totalPagado: number
    }>
    totals: {
      totalSubastas: number
      itemsGanados: number
      importeTotalPagado: number
    }
  }
}
```

### GET /api/users/me/active-bids

Pujas activas del usuario.

### GET /api/users/me/payment-methods

Métodos de pago.

**Response:**
```typescript
{
  data: Array<{
    id: string
    tipo: 'cuenta_bancaria' | 'tarjeta_credito' | 'cheque_certificado'
    estado: 'pendiente' | 'verificado' | 'rechazado'
    esInternacional: boolean
    bankAccount?: { titular: string; cbu: string; banco: string; moneda: string }
    creditCard?: { titular: string; ultimosDigitos: string; red: string }
    certifiedCheck?: { numeroCheque: string; monto: number; montoDisponible: number; vencimiento: string }
  }>
}
```

### GET /api/users/me/penalties

Penalidades pendientes.

### GET /api/users/me/notifications

Notificaciones del usuario.

---

## Consignments

### GET /api/consignments

Lista de consignaciones del usuario.

### POST /api/consignments

Crear solicitud de consignación.

**Body:**
```typescript
{
  descripcion: string
  categoria?: string
  valorEstimado?: number
  esCompuesto?: boolean
  esObraArte?: boolean
  artistaDisenador?: string
  fechaCreacionObra?: string  // ISO datetime
  historia?: string
  specs?: Array<{ clave: string; valor: string }>
}
```

---

## Storage

### POST /api/storage/upload-url

Obtener URL pre-firmada para subir imágenes a Supabase Storage. **Requiere auth.**

**Body:** `{ filename: string; contentType: string; folder: 'consignments' | 'items' | 'docs' }`

**Response:** `{ data: { uploadUrl: string; token: string; path: string; publicUrl: string } }`

> **Para registro previo a auth** (P-03), usar `lib/uploadImage.ts` que sube directamente
> al bucket `auction-images` con el anon key. El bucket debe tener política RLS que permita
> INSERT anónimo en la carpeta `docs/`.

**Flujo de upload autenticado:**
1. `POST /api/storage/upload-url` con `{ filename, contentType, folder }`
2. `PUT uploadUrl` con el binario de la imagen
3. Usar `publicUrl` en los campos `fotoPerfilUrl`, `fotoDocFrenteUrl`, etc.
