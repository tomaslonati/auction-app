import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, DELETE } from '@/app/api/users/me/payment-methods/[id]/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'pm1' }) }

describe('GET /api/users/me/payment-methods/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna método de pago', async () => {
    vi.mocked(prisma.paymentMethod.findFirst).mockResolvedValue({ id: 'pm1', tipo: 'tarjeta_credito' } as any)

    const res = await GET(makeAuthRequest('GET', '/api/users/me/payment-methods/pm1'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.id).toBe('pm1')
  })

  it('404 — no encontrado', async () => {
    vi.mocked(prisma.paymentMethod.findFirst).mockResolvedValue(null)

    const res = await GET(makeAuthRequest('GET', '/api/users/me/payment-methods/pm1'), params)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/users/me/payment-methods/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — elimina método de pago', async () => {
    vi.mocked(prisma.paymentMethod.findFirst).mockResolvedValue({ id: 'pm1' } as any)
    vi.mocked(prisma.auctionSession.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.purchase.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.paymentMethod.delete).mockResolvedValue({} as any)

    const res = await DELETE(makeAuthRequest('DELETE', '/api/users/me/payment-methods/pm1'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.message).toBe('Deleted')
  })

  it('404 — no encontrado', async () => {
    vi.mocked(prisma.paymentMethod.findFirst).mockResolvedValue(null)

    const res = await DELETE(makeAuthRequest('DELETE', '/api/users/me/payment-methods/pm1'), params)
    expect(res.status).toBe(404)
  })

  it('400 — tiene sesión activa', async () => {
    vi.mocked(prisma.paymentMethod.findFirst).mockResolvedValue({ id: 'pm1' } as any)
    vi.mocked(prisma.auctionSession.findFirst).mockResolvedValue({ id: 's1' } as any)

    const res = await DELETE(makeAuthRequest('DELETE', '/api/users/me/payment-methods/pm1'), params)
    expect(res.status).toBe(400)
  })

  it('400 — tiene compras pendientes', async () => {
    vi.mocked(prisma.paymentMethod.findFirst).mockResolvedValue({ id: 'pm1' } as any)
    vi.mocked(prisma.auctionSession.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.purchase.findFirst).mockResolvedValue({ id: 'p1' } as any)

    const res = await DELETE(makeAuthRequest('DELETE', '/api/users/me/payment-methods/pm1'), params)
    expect(res.status).toBe(400)
  })
})
