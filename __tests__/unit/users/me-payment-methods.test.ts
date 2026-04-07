import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/users/me/payment-methods/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

describe('GET /api/users/me/payment-methods', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna métodos de pago', async () => {
    vi.mocked(prisma.paymentMethod.findMany).mockResolvedValue([
      { id: 'pm1', tipo: 'cuenta_bancaria', estado: 'verificado', bankAccount: { banco: 'Galicia' }, creditCard: null, certifiedCheck: null },
    ] as any)

    const res = await GET(makeAuthRequest('GET', '/api/users/me/payment-methods'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
  })

  it('200 — lista vacía', async () => {
    vi.mocked(prisma.paymentMethod.findMany).mockResolvedValue([])

    const res = await GET(makeAuthRequest('GET', '/api/users/me/payment-methods'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(0)
  })
})
