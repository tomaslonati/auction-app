import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auctions/[id]/bids/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'a1' }) }
const validBody = { itemId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', paymentMethodId: 'b1cccd00-0d1c-4ef8-bb6d-6bb9bd380b22', monto: 110 }

describe('POST /api/auctions/[id]/bids', () => {
  beforeEach(() => vi.clearAllMocks())

  const setupHappyPath = () => {
    vi.mocked(prisma.auctionSession.findFirst).mockResolvedValue({ id: 's1' } as any)
    vi.mocked(prisma.paymentMethod.findFirst)
      .mockResolvedValueOnce({ id: 'pm-verified' } as any) // verified check
      .mockResolvedValueOnce({ id: validBody.paymentMethodId, tipo: 'cuenta_bancaria', esInternacional: false, certifiedCheck: null } as any)
    vi.mocked(prisma.auction.findUnique).mockResolvedValue({ id: 'a1', moneda: 'pesos', categoria: 'comun' } as any)
    vi.mocked(prisma.bid.findFirst)
      .mockResolvedValueOnce(null) // no pending bid
      .mockResolvedValueOnce(null) // no confirmed bid
    vi.mocked(prisma.item.findUnique).mockResolvedValue({ id: validBody.itemId, subastaId: 'a1', precioBase: 100 } as any)
    vi.mocked(prisma.bid.create).mockResolvedValue({ id: 'b1', monto: 110 } as any)
  }

  it('201 — crea oferta', async () => {
    setupHappyPath()

    const res = await POST(makeAuthRequest('POST', '/api/auctions/a1/bids', validBody), params)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.id).toBe('b1')
  })

  it('422 — body inválido', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/auctions/a1/bids', { monto: -10 }), params)
    expect(res.status).toBe(422)
  })

  it('403 — sin sesión activa', async () => {
    vi.mocked(prisma.auctionSession.findFirst).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/auctions/a1/bids', validBody), params)
    expect(res.status).toBe(403)
  })

  it('422 — oferta por debajo del mínimo', async () => {
    vi.mocked(prisma.auctionSession.findFirst).mockResolvedValue({ id: 's1' } as any)
    vi.mocked(prisma.paymentMethod.findFirst)
      .mockResolvedValueOnce({ id: 'pm-verified' } as any)
      .mockResolvedValueOnce({ id: validBody.paymentMethodId, tipo: 'cuenta_bancaria', esInternacional: false, certifiedCheck: null } as any)
    vi.mocked(prisma.auction.findUnique).mockResolvedValue({ id: 'a1', moneda: 'pesos', categoria: 'comun' } as any)
    vi.mocked(prisma.bid.findFirst).mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    vi.mocked(prisma.item.findUnique).mockResolvedValue({ id: validBody.itemId, subastaId: 'a1', precioBase: 100 } as any)

    const res = await POST(makeAuthRequest('POST', '/api/auctions/a1/bids', { ...validBody, monto: 50 }), params)
    expect(res.status).toBe(422)
  })
})
