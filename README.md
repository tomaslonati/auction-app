This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Testing

El proyecto usa [Vitest](https://vitest.dev/) para tests unitarios e integrales.

### Tests unitarios

Cubren los 47 route handlers de la API con mocks de Prisma, Supabase y email. No requieren DB ni servidor levantado.

```bash
npm test                  # corre todos los tests unitarios
npm run test:watch        # modo watch (re-corre al guardar)
npm run test:coverage     # genera reporte de cobertura en /coverage
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

### Estructura

```
__tests__/
  setup.ts                  # mocks globales (Prisma, Supabase, email, next/server)
  helpers.ts                # makeRequest() / makeAuthRequest()
  unit/
    auth/                   # register-step1, register-complete, login, logout, password-*
    users/                  # me, me-password, me-metrics, me-notifications, me-participations,
                            # me-penalties, me-payment-methods*
    auctions/               # auctions, auctions-id, catalog, catalog-item, bids, join, leave,
                            # current-item
    consignments/           # consignments, consignments-id, photos, declaration,
                            # inspection-response, insurance, location, payout-account
    purchases/              # purchases-id, purchases-pickup
    admin/                  # users-category, payment-methods-verify, consignments-inspect,
                            # consignments-assign-auction, auctions-adjudicate
    storage/                # upload-url
  integration/
    auth.integration.test.ts
    auctions.integration.test.ts
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
