import { vi } from 'vitest'

vi.mock('next/server', async (importOriginal) => {
  const original = await importOriginal<typeof import('next/server')>()
  return { ...original, after: vi.fn() }
})

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    auction: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    item: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    bid: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    purchase: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    pais: { findUnique: vi.fn() },
    paymentMethod: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    bankAccount: { findUnique: vi.fn() },
    certifiedCheck: { findUnique: vi.fn(), update: vi.fn() },
    auctionSession: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    penalty: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    consignment: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    consignmentInspection: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    consignmentLocation: { findUnique: vi.fn(), create: vi.fn() },
    consignmentPhoto: { createMany: vi.fn(), count: vi.fn() },
    consignmentSpec: { createMany: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
    consignmentItem: { create: vi.fn() },
    auctionSpec: { createMany: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
    insurancePolicy: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    insurancePolicyConsignment: { findMany: vi.fn(), create: vi.fn() },
    payoutAccount: { create: vi.fn() },
    catalogo: { findUnique: vi.fn() },
    empleado: { findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: 'user-test-id' }),
  requireAdmin: vi.fn().mockResolvedValue({ userId: 'admin' }),
}))

vi.mock('@/lib/email', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue({ id: 'mock-email-id' }),
  sendRegistrationApprovedEmail: vi.fn().mockResolvedValue({ id: 'mock-email-id' }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: 'supabase-user-id' } }, error: null }),
        updateUserById: vi.fn().mockResolvedValue({ data: {}, error: null }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-test-id', app_metadata: {} } }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {
          session: { access_token: 'mock-token', refresh_token: 'mock-refresh' },
          user: { id: 'user-test-id', email: 'test@test.com' },
        },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        createSignedUploadUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.url', token: 'tok' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://public.url/path' } }),
      })),
    },
  })),
}))
