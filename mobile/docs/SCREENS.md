# Aucty — Inventario de Pantallas

**Prioridad de fuente de verdad:** ENDPOINTS > DISEÑO (PNG) > PDF

Imágenes de diseño en: `../app/claude/design/` (relativo al repo raíz)

**Streaming (P-20) NO se desarrolla.**

---

## Estado de implementación

| P-ID | Nombre | Módulo | Imagen PNG | Ruta Expo Router | Estado |
|---|---|---|---|---|---|
| P-01 | Welcome / Login | Auth | P-01.png | `(auth)/index` | ✅ Listo |
| P-02 | Datos personales | Auth | P-02.png | `(auth)/register/personal-data` | ✅ Listo |
| P-03 | Carga de documentos | Auth | P-03-1, P-03-2, P-03-3 | `(auth)/register/documents` | ✅ Listo |
| P-04 | Verificación pendiente | Auth | P-04.png ⚠️ inconsistente | `(auth)/register/pending` | ✅ Placeholder |
| P-05 | Establecer contraseña | Auth | p-05.png | `(auth)/set-password` | ✅ Listo |
| P-06 | — | Auth | — | *(mismo que P-01)* | — |
| P-07 | Recuperar contraseña | Auth | — | `(auth)/forgot-password` | ✅ Listo |
| P-08 | Medios de pago (listado) | Pago | P-08.png, P-08-sin medios.png | `(app)/payment-methods/index` | 🔲 Fase 4 |
| P-09 | Selector tipo pago | Pago | p-09.png | bottom sheet en P-08 | 🔲 Fase 4 |
| P-10 | Agregar cuenta bancaria | Pago | P-10.png | bottom sheet en P-08 | 🔲 Fase 4 |
| P-11 | Agregar tarjeta crédito | Pago | P-11.png | bottom sheet en P-08 | 🔲 Fase 4 |
| P-12 | Agregar cheque certificado | Pago | P-12.png | bottom sheet en P-08 | 🔲 Fase 4 |
| P-13 | Home | Catálogo | P-13-HOME.png | `(app)/(tabs)/index` | 🔲 Fase 2 |
| P-14 | Detalle de subasta | Catálogo | — | `(app)/auction/[id]/index` | 🔲 Fase 2 |
| P-15 | Catálogo de piezas | Catálogo | P-15.png | `(app)/auction/[id]/catalog` | 🔲 Fase 2 |
| P-16 | Detalle de pieza | Catálogo | P-16-17.png | `(app)/auction/[id]/item/[itemId]` | 🔲 Fase 2 |
| P-17 | Sala de subasta | Real-time | P-16-17.png | `(app)/auction/[id]/room` | 🔲 Fase 3 |
| P-18 | Confirmación de puja | Real-time | P-18.png | bottom sheet en room | 🔲 Fase 3 |
| P-19 | Adjudicación / resultado | Real-time | — | modal en room | 🔲 Fase 3 |
| P-20 | Streaming | Streaming | — | **NO SE DESARROLLA** | ❌ |
| P-21 | Consignación: datos del bien | Consignación | — | `(app)/consignment/new/item-data` | 🔲 Fase 5 |
| P-22 | Consignación: fotos | Consignación | — | `(app)/consignment/new/photos` | 🔲 Fase 5 |
| P-23 | Consignación: declaración jurada | Consignación | — | `(app)/consignment/new/declaration` | 🔲 Fase 5 |
| P-24 | Seguimiento bienes consignados | Consignación | — | `(app)/consignment/index` | 🔲 Fase 5 |
| P-25 | Detalle bien consignado | Consignación | — | `(app)/consignment/[id]` | 🔲 Fase 5 |
| P-26 | Resultado inspección | Consignación | — | modal en consignment/[id] | 🔲 Fase 5 |
| P-27 | Historial participaciones | Historial | — | `(app)/history/index` | 🔲 Fase 5 |
| P-28 | Detalle subasta pasada | Historial | — | `(app)/history/[auctionId]` | 🔲 Fase 5 |
| P-29 | Métricas personales | Historial | — | `(app)/metrics` | 🔲 Fase 5 |
| P-30 | Perfil de usuario | Perfil | — | `(app)/(tabs)/profile` | 🔲 Fase 5 |
| P-31 | Configuración | Perfil | — | `(app)/settings` | 🔲 Fase 5 |

---

## Fases de implementación

### ✅ Fase 1 — Scaffold + Auth
P-01, P-02, P-03, P-04 (placeholder), P-05, P-07

### 🔲 Fase 2 — Home + Catálogo
P-13, P-14, P-15, P-16

### 🔲 Fase 3 — Sala de subasta (real-time)
P-17, P-18, P-19
> Requiere WebSocket o polling. Ver endpoint `GET /api/auctions/:id/current-item`

### 🔲 Fase 4 — Medios de pago
P-08, P-09, P-10, P-11, P-12

### 🔲 Fase 5 — Resto
P-21–P-31

---

## Notas de diseño por pantalla

### P-01 (Login)
- Fondo: `LinearGradient` `['#6A7472', '#D7E0DD', '#FEFFFF']` vertical
- Inputs: glassmorphism `rgba(255,255,255,0.10)`
- Logo: placeholder (asset pendiente)
- El botón "Registrarme" abre el flujo de registro (P-02)
- "Continuar como invitado" navega a `(app)` sin sesión

### P-02 (Datos personales)
- Fondo: `#E8EAEC`
- Step "01" con barra de progreso al 33%
- Row con Nombre + Apellido (flex: 1 cada uno)
- Campos en mayúsculas como labels (estilo de la app)

### P-03 (Documentos)
- 3 sub-pasos en una misma pantalla controlados por estado
- Barra de progreso avanza en cada paso (33%, 66%, 100%)
- Frente y dorso: aspect ratio 4:3
- Foto de perfil: circular, aspect ratio 1:1
- Al enviar: hace PUT /api/users/me con las URLs

### P-08 (Medios de pago)
- Lista agrupada: CUENTAS BANCARIAS / TARJETAS DE CRÉDITO / CHEQUES
- Alerta de verificación pendiente si ninguno está verificado
- Bottom sheet para agregar (P-09 → selector → P-10/P-11/P-12)

### P-15 (Catálogo)
- Filtros como tabs: "Todos los Lotes", categorías
- Cards: imagen full-width, badge estado, nombre, oferta actual, botón Ofertar

### P-17 (Sala)
- Pantalla más crítica del sistema
- Actualizaciones en tiempo real via polling o WebSocket
- `precioBase`, `highestBid`, timer, historial de pujas
- Botón Pujar abre P-18 (bottom sheet de confirmación)
