---
name: Proyecto mobile Aucty
description: Estado y estructura del proyecto React Native mobile dentro del monorepo auction-app
type: project
---

Proyecto mobile creado en `/auction-app/mobile` como parte del monorepo.

**Why:** El usuario quiere armar el frontend mobile de la app de subastas. El backend Next.js ya existe.

**How to apply:** Siempre trabajar en `/auction-app/mobile` para el frontend mobile. No confundir con el backend en `/auction-app`.

## Stack
- Expo SDK 54 + Expo Router v6
- NativeWind v4 + Tailwind CSS v3
- TypeScript strict
- Supabase auth (JWT), Zustand, Inter font

## Estado actual (2026-05-07)
- Fase 1 completada: scaffold + design system + pantallas auth (P-01, P-02, P-03, P-04, P-05, P-07)
- Fase 2 pendiente: Home (P-13), Catálogo (P-15, P-16)
- Fase 3 pendiente: Sala de subasta (P-17, P-18)
- Fase 4 pendiente: Medios de pago (P-08–P-12)
- Fase 5 pendiente: Perfil, historial, consignación

## Documentación clave
- `mobile/CLAUDE.md` — instrucciones para agentes
- `mobile/docs/STYLE_GUIDE.md` — design system
- `mobile/docs/API.md` — contratos endpoints
- `mobile/docs/SCREENS.md` — inventario pantallas con estado

## Design system
- Dos contextos visuales: AUTH (gradiente oscuro) y APP (gris claro #E8EAEC)
- Tokens en `mobile/constants/design.ts`
- Componentes base en `mobile/components/ui/`
- Nunca hardcodear colores ni tipografía — usar siempre los tokens
