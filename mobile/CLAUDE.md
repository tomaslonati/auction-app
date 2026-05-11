# Aucty — Mobile App

## Stack
- **Expo SDK 54** + **Expo Router v6** (file-based routing, similar a Next.js App Router)
- **NativeWind v4** (Tailwind CSS para React Native) — preferir StyleSheet para estilos complejos
- **TypeScript** strict mode
- **Supabase** auth (JWT via Bearer token)
- **Zustand** para estado global (session, user)
- **Inter** font (`@expo-google-fonts/inter`)

## Comandos

```bash
cd mobile
npm start          # Expo Go / simulador
npm run ios        # iOS simulator
npm run android    # Android emulator
```

El backend Next.js debe correr en `localhost:3000` para las llamadas API.

## Estructura de directorios

```
app/
  _layout.tsx                   # Root: carga fuentes, auth guard, providers
  (auth)/                        # Stack sin tab bar
    index.tsx                    # P-01: Login / Welcome
    register/
      personal-data.tsx          # P-02: Datos personales
      documents.tsx              # P-03: DNI frente, dorso + foto perfil
      pending.tsx                # P-04: Verificación pendiente
    set-password.tsx             # P-05: Establecer contraseña
    forgot-password.tsx          # P-07: Recuperar contraseña
  (app)/                         # Stack autenticado
    _layout.tsx                  # Stack wrapper
    (tabs)/
      _layout.tsx                # Bottom tab navigator
      index.tsx                  # P-13: Home
      auctions.tsx               # Lista de subastas
      profile.tsx                # P-30: Perfil
    auction/[id]/
      index.tsx                  # P-14: Detalle subasta
      catalog.tsx                # P-15: Catálogo de piezas
      item/[itemId].tsx          # P-16: Detalle pieza
      room.tsx                   # P-17: Sala + P-18 confirmación puja
    payment-methods/index.tsx    # P-08: Medios de pago
    consignment/
      index.tsx                  # P-24: Seguimiento consignaciones
      new/item-data.tsx          # P-21: Datos del bien
      new/photos.tsx             # P-22: Fotos del bien
      new/declaration.tsx        # P-23: Declaración jurada
      [id].tsx                   # P-25: Detalle consignación
    history/
      index.tsx                  # P-27: Historial participaciones
      [auctionId].tsx            # P-28: Detalle subasta pasada
    metrics.tsx                  # P-29: Métricas personales
    settings.tsx                 # P-31: Configuración

components/ui/                   # Componentes base del design system
  Button.tsx                     # ButtonPrimary, ButtonOutline
  Input.tsx                      # Input (variante auth y app)
  Card.tsx
  Badge.tsx
  ScreenHeader.tsx
  SectionLabel.tsx

constants/design.ts              # TODOS los tokens: colores, tipografía, espaciado, radios
lib/
  supabase.ts                    # Cliente Supabase
  api.ts                         # API client (fetch con auth header automático)
  store.ts                       # Zustand store
```

## Reglas de diseño — IMPORTANTE

1. **Nunca hardcodear colores** — siempre usar `colors.*` de `constants/design.ts`
2. **Nunca hardcodear tipografía** — usar `typography.*` o `fonts.*` de `constants/design.ts`
3. **Dos contextos visuales distintos**:
   - **Auth** (P-01): fondo `LinearGradient`, inputs con `inputAuthBg`, texto blanco
   - **App** (P-02+): fondo `backgroundApp` (#E8EAEC), inputs blancos, texto oscuro
4. Los inputs siempre tienen `borderRadius: radius.full` (32px)
5. Los botones primarios: `ButtonPrimary`, los secundarios: `ButtonOutline`
6. Las secciones con label uppercase usan `SectionLabel`
7. El bottom tab bar flota sobre la pantalla — agregar `paddingBottom: 100` al scroll de contenido

## Prioridad de fuente de verdad

```
ENDPOINTS (app/api/) > DISEÑO (imágenes PNG) > PDF (Pantallas_Sistema_Subastas.pdf)
```

Las imágenes PNG están en `../app/claude/design/` (fuera del proyecto mobile).

## Auth flow

```
Login: supabase.auth.signInWithPassword({ email, password })
→ JWT se persiste en SecureStore automáticamente
→ root layout detecta session y redirige a /(app)

Registro:
1. supabase.auth.signUp({ email, password })
2. PUT /api/users/me con datos personales y URLs de documentos
3. Estado queda 'pendiente_aprobacion' → P-04
4. Empresa aprueba → usuario recibe email → P-05 (set-password)
5. Estado pasa a 'aprobado' → acceso completo

Logout: supabase.auth.signOut() → redirige a /(auth)
```

## Estado del usuario

| Estado | Descripción | Acción |
|---|---|---|
| `pendiente_aprobacion` | Esperando revisión | Mostrar P-04 |
| `aprobado` | Acceso completo | App normal |
| `rechazado` | Registro rechazado | Mensaje + opción de reenviar |
| `bloqueado` | Cuenta bloqueada | Mensaje descriptivo en P-30 |
| `multado` | Multa pendiente | Aviso en P-30 |
| `proceso_judicial` | API retorna 403 | Mensaje de error |

## API client

```typescript
import { api } from '@/lib/api';

const { data, error } = await api.get<User>('/api/users/me');
const { data, error } = await api.post('/api/auctions/id/bids', { itemId, paymentMethodId, monto });
```

El token se inyecta automáticamente desde la sesión de Supabase.
Todos los endpoints responden `{ data, error }` — siempre verificar `error !== null`.

## Documentación adicional

- `docs/STYLE_GUIDE.md` — Design system completo con ejemplos
- `docs/API.md` — Contratos de todos los endpoints
- `docs/SCREENS.md` — Inventario de pantallas con estado de implementación
