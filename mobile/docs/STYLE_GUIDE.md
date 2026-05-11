# Aucty — Style Guide

Fuente de verdad del design system. Todos los valores vienen de `constants/design.ts`.

---

## Contextos visuales

La app tiene **dos contextos visuales** distintos:

### Auth (P-01)
- Fondo: `LinearGradient` con `colors.gradientAuthColors` y `colors.gradientAuthLocations`
- Inputs: `variant="auth"` → `backgroundColor: rgba(255,255,255,0.10)`, texto blanco
- Texto principal: blanco `#FFFFFF`
- Texto secundario del título: `#C8C7C7`

### App (P-02 en adelante)
- Fondo: `colors.backgroundApp` (`#E8EAEC`)
- Inputs: `variant="app"` → `backgroundColor: #FFFFFF`, texto oscuro
- Texto principal: `colors.textPrimary` (`#0A0A0A`)
- Texto de títulos de pantalla (step titles): `colors.textTertiary` (`#9CA3AF`)

---

## Colores

```typescript
// constants/design.ts → colors

// Gradiente auth
gradientAuthColors: ['#6A7472', '#D7E0DD', '#FEFFFF']
gradientAuthLocations: [0.1683, 0.8702, 1.0]  // 180deg top→bottom

// Fondos
backgroundApp: '#E8EAEC'
surface: '#FFFFFF'

// Texto
textPrimary: '#0A0A0A'
textSecondary: '#6B7280'
textTertiary: '#9CA3AF'       // step titles, placeholders de pantalla
textPlaceholder: '#808A88'    // placeholder en inputs
textOnPrimary: '#FFF0F0'      // texto sobre botón negro
textInverted: '#FFFFFF'

// Acciones
primary: '#151515'            // botón principal, color primario
inputAuthBg: 'rgba(255,255,255,0.10)'
inputAppBg: '#FFFFFF'
divider: 'rgba(0,0,0,0.08)'

// Estados
success: '#22C55E'  successBg: '#DCFCE7'
error: '#DC2626'    errorBg: '#FEE2E2'
warning: '#F59E0B'  warningBg: '#FEF3C7'
pending: '#6B7280'  pendingBg: '#F3F4F6'
```

---

## Tipografía

Font: **Inter** (cargada vía `@expo-google-fonts/inter`)

| Token | Tamaño | Peso | Letter-spacing | Uso |
|---|---|---|---|---|
| `display` | 40px | 400 | -2px | Título welcome (P-01) |
| `h1` | 30px | 400 | -1px | Step titles ("Datos personales") |
| `h2` | 22px | 600 | 0 | Títulos de sección |
| `h3` | 18px | 600 | 0 | Títulos de card |
| `body` | 16px | 400 | 0 | Texto general |
| `bodyMedium` | 16px | 500 | 0 | Texto de botones |
| `small` | 14px | 400 | 0 | Texto secundario |
| `label` | 11px | 600 | +0.5px | Labels uppercase (NOMBRE, CUENTAS BANCARIAS) |
| `price` | 32px | 700 | -1px | Montos en sala de subasta |
| `link` | 16px | 400 | -0.48px | Links subrayados |

### Font families

```typescript
fonts.regular   = 'Inter_400Regular'
fonts.medium    = 'Inter_500Medium'
fonts.semiBold  = 'Inter_600SemiBold'
fonts.bold      = 'Inter_700Bold'
```

---

## Espaciado

Base grid: **4px**

```typescript
spacing.xs   = 4
spacing.sm   = 8
spacing.md   = 16
spacing.lg   = 24
spacing.xl   = 32
spacing.xxl  = 48
spacing.xxxl = 64
```

---

## Border radius

```typescript
radius.full = 9999  // Buttons, inputs — full pill
radius.xl   = 16    // Cards
radius.lg   = 12
radius.md   = 8
radius.sm   = 4
```

---

## Componentes

### ButtonPrimary

```tsx
<ButtonPrimary
  label="Continuar"
  onPress={handlePress}
  loading={false}        // muestra spinner
  disabled={false}
  icon={<Icon />}        // opcional, va antes del label
/>
```

Estilos: `bg #151515`, `borderRadius: full`, `minHeight: 56px`, texto `#FFF0F0`.

### ButtonOutline

```tsx
<ButtonOutline label="Registrarme" onPress={handlePress} />
```

Estilos: `border 1px #151515`, `borderRadius: full`, `bg transparent`.
En contexto auth: sobreescribir `borderColor: 'rgba(255,255,255,0.4)'`.

### Input

```tsx
// Contexto app (default)
<Input
  label="NOMBRE"              // uppercase, pequeño
  placeholder="Jane"
  value={value}
  onChangeText={setValue}
  error="Requerido"           // muestra mensaje debajo
/>

// Contexto auth (glassmorphism)
<Input
  variant="auth"
  placeholder="Correo Electrónico"
  ...
/>
```

### Card

```tsx
<Card elevated>
  <Text>Contenido</Text>
</Card>
```

`borderRadius: 16`, `bg white`. `elevated` agrega sombra.

### Badge

```tsx
<Badge label="ACTIVA" variant="success" />
<Badge label="GANANDO" variant="success" />
<Badge label="PENDIENTE" variant="pending" />
<Badge label="RECHAZADO" variant="error" />
```

### ScreenHeader

```tsx
<ScreenHeader
  title="Métodos de pago"
  onBack={() => router.back()}   // opcional, usa router.back() por defecto
  rightElement={<IconButton />}  // opcional
/>
```

### SectionLabel

```tsx
<SectionLabel>CUENTAS BANCARIAS</SectionLabel>
```

---

## Patrones de layout

### Pantalla con botón fijo abajo

```tsx
<View style={{ flex: 1, backgroundColor: colors.backgroundApp, paddingTop: insets.top }}>
  <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
    {/* contenido */}
  </ScrollView>
  <View style={styles.footer}>  {/* position: 'absolute', bottom: 0 */}
    <ButtonPrimary label="Continuar" onPress={...} />
  </View>
</View>
```

### Pantalla con tab bar flotante

El tab bar flota 20px desde el bottom con altura 72px. Agregar `paddingBottom: 110` al último scroll para que el contenido no quede tapado.

### Step indicator (onboarding)

```tsx
<Text style={{ fontSize: 48, color: colors.textTertiary }}>01</Text>
<View style={styles.progressBar}>
  <View style={[styles.progressFill, { width: '33%' }]} />
</View>
<Text style={{ ...typography.h1, color: colors.textTertiary }}>Título de paso</Text>
```

### Bottom sheet (modales de pago, confirmación de puja)

Usar `Modal` de React Native con animación de slide, fondo semitransparente `rgba(0,0,0,0.5)`, y contenido en un View blanco con `borderTopLeftRadius: 24, borderTopRightRadius: 24`.

---

## Íconos

El proyecto usa `@expo/vector-icons` (incluido con Expo). Usar `Ionicons` como set principal.

```tsx
import { Ionicons } from '@expo/vector-icons';
<Ionicons name="home-outline" size={24} color={colors.textSecondary} />
```

Íconos de tab bar recomendados:
- Home: `home` / `home-outline`
- Subastas: `hammer` / `hammer-outline`  
- Profile: `person` / `person-outline`

---

## DO / DON'T

| ✅ DO | ❌ DON'T |
|---|---|
| `color: colors.textPrimary` | `color: '#0A0A0A'` |
| `fontFamily: fonts.semiBold` | `fontWeight: '600'` sin fontFamily |
| `borderRadius: radius.full` | `borderRadius: 32` |
| `gap: spacing.md` | `gap: 16` |
| Usar `Input` component | `TextInput` directo |
| Usar `ButtonPrimary` / `ButtonOutline` | `TouchableOpacity` con estilos inline |
