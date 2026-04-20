# Testing con Postman

Guía para probar los endpoints de la API manualmente. Asume que el servidor está corriendo en `http://localhost:3000`.

## Correr el seed

El seed crea usuarios en Supabase Auth y datos de prueba en la DB. Es idempotente — se puede correr múltiples veces.

```bash
npm run seed
```

---

## Usuarios de prueba

| Alias   | Email                   | Contraseña   | Categoría | Estado                 |
|---------|-------------------------|--------------|-----------|------------------------|
| Alice   | alice@auction.test      | alice1234!   | oro       | aprobado               |
| Bob     | bob@auction.test        | bob12345!    | comun     | aprobado               |
| Charlie | charlie@auction.test    | charlie123!  | —         | pendiente_verificacion |

**IDs de usuario** (generados por Supabase Auth, pueden cambiar si se re-crea el usuario):

| Alias   | ID                                     |
|---------|----------------------------------------|
| Alice   | `59771324-30ce-4f4e-ace4-5ee9bf86afe4` |
| Bob     | `5a4c34d8-bdce-470c-abd8-c102d6164a20` |
| Charlie | `90b33cea-050c-422d-86d1-03ebfb313a88` |

> Los IDs de usuario pueden cambiar si se ejecuta `npm run seed` en una instalación limpia. Los demás IDs son fijos.

---

## IDs fijos del seed

Estos IDs son constantes en el código del seeder y no cambian entre ejecuciones.

### Métodos de pago (cuenta bancaria verificada)

| Dueño | ID |
|-------|----|
| Alice | `dddddddd-dddd-4ddd-addd-dddddddddddd` |
| Bob   | `eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee` |

### Subastas

| Nombre              | Estado     | ID |
|---------------------|------------|----|
| Subasta Primavera 2026 | `activa`   | `aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa` |
| Subasta Invierno 2026  | `programada` | `a1111111-1111-4111-a111-111111111111` |

### Ítems (en la subasta activa)

| Pieza | Descripción                              | Estado       | Precio base | ID |
|-------|------------------------------------------|--------------|-------------|-----|
| P-001 | Reloj de bolsillo Longines circa 1920    | `en_subasta` | $15.000     | `bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb` |
| P-002 | Pintura "Paisaje Pampeano" (1950)        | `pendiente`  | $80.000     | `cccccccc-cccc-4ccc-accc-cccccccccccc` |

### Consignación de Alice

| Estado    | Descripción                       | ID |
|-----------|-----------------------------------|----|
| `aceptado` | Jarrón de porcelana china, Qing  | `ffffffff-ffff-4fff-afff-ffffffffffff` |

> La consignación ya tiene inspección creada (`resultado: aceptado`, `valorBase: 45000`, `comision: 15%`, `userAcepta: true`).

### Países

| Número | Nombre         |
|--------|----------------|
| `54`   | Argentina      |
| `1`    | Estados Unidos |

---

## Obtener token de acceso

Todos los endpoints protegidos requieren `Authorization: Bearer <token>`.

**POST** `/api/auth/login`

```json
{
  "email": "alice@auction.test",
  "password": "alice1234!"
}
```

La respuesta incluye `data.access_token`. Usarlo como header en las siguientes requests:

```
Authorization: Bearer eyJhbGci...
```

---

## Flujos de prueba sugeridos

### 1. Login y perfil

```
POST /api/auth/login         body: { email, password }
GET  /api/users/me           (con token de alice)
```

### 2. Ver subasta y pujar

```
GET  /api/auctions
GET  /api/auctions/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa
GET  /api/auctions/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/catalog
POST /api/auctions/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/join          (con token de bob)

# Crear oferta sobre P-001 (en_subasta)
POST /api/auctions/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bids
{
  "itemId": "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb",
  "paymentMethodId": "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee",
  "monto": 20000
}
```

### 3. Adjudicar ítem (admin — no requiere token)

```
POST /api/admin/auctions/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/items/bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb/adjudicate
{
  "comision": 1500,
  "costoEnvio": 500
}
```

### 4. Ver mis compras

```
GET /api/purchases/:id       (con token del ganador)
```

### 5. Consignación de Alice (estado aceptado — lista para asignar a subasta)

```
# Asignar a subasta programada (admin)
POST /api/admin/consignments/ffffffff-ffff-4fff-afff-ffffffffffff/assign-auction
{
  "auctionId": "a1111111-1111-4111-a111-111111111111",
  "numeroPieza": "P-003",
  "descripcion": "Jarrón Qing — porcelana",
  "precioBase": 45000
}
```

### 6. Verificar método de pago de Charlie (admin)

```
# Primero Charlie debe tener un PM pendiente (crearlo con su token)
POST /api/users/me/payment-methods/bank-account    (token charlie)
{
  "banco": "HSBC",
  "numeroCuenta": "123456",
  "titular": "Charlie López",
  "moneda": "ARS",
  "numeroPaisId": 54
}

# Luego admin lo verifica
PATCH /api/admin/payment-methods/<pm-id>/verify
{ "estado": "verificado" }
```

### 7. Subir foto

```
POST /api/storage/upload-url
{
  "filename": "foto.jpg",
  "contentType": "image/jpeg",
  "folder": "consignments"
}
# Responde con uploadUrl (pre-signed) y publicUrl
```

---

## Notas

- Los endpoints **admin** no requieren token (`requireAdmin` está deshabilitado en desarrollo).
- El endpoint `POST /api/auth/register/complete` tampoco requiere token: recibe `userId` en el body.
- Charlie no puede unirse a subastas ni pujar porque su estado es `pendiente_verificacion`.
- Alice tiene categoría `oro` — puede unirse a la subasta activa (también categoría `oro`). Bob tiene `comun` y no puede unirse a esa subasta.
