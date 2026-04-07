import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/admin/auctions/[id]/items/[itemId]/adjudicate/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'auction1', itemId: 'item1' }) }

describe('POST /api/admin/auctions/[id]/items/[itemId]/adjudicate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('201 — adjudica ítem con oferta ganadora', async () => {
    vi.mocked(prisma.auction.findUnique).mockResolvedValue({ id: 'auction1', estado: 'activa' } as any)
    vi.mocked(prisma.item.findFirst)
      .mockResolvedValueOnce({ id: 'item1', numeroPieza: 'P-001', subastaId: 'auction1', estado: 'en_subasta' } as any)
      .mockResolvedValueOnce(null) // nextItem
    vi.mocked(prisma.bid.findFirst).mockResolvedValue({ id: 'bid1', userId: 'user1', monto: 1500, paymentMethodId: 'pm1' } as any)
    vi.mocked(prisma.bid.updateMany).mockResolvedValue({ count: 0 } as any)
    vi.mocked(prisma.paymentMethod.findUnique).mockResolvedValue({ id: 'pm1', certifiedCheck: null } as any)
    vi.mocked(prisma.purchase.create).mockResolvedValue({ id: 'pur1', montoFinal: 1500 } as any)
    vi.mocked(prisma.item.update).mockResolvedValue({ id: 'item1', estado: 'vendido' } as any)
    vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'n1' } as any)
    vi.mocked(prisma.bid.findMany).mockResolvedValue([])

    const res = await POST(makeAuthRequest('POST', '/api/admin/auctions/auction1/items/item1/adjudicate', { comision: 50, costoEnvio: 20 }), params)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.purchase.id).toBe('pur1')
  })

  it('201 — adjudica ítem sin postores (sin_postor)', async () => {
    vi.mocked(prisma.auction.findUnique).mockResolvedValue({ id: 'auction1', estado: 'activa' } as any)
    vi.mocked(prisma.item.findFirst)
      .mockResolvedValueOnce({ id: 'item1', numeroPieza: 'P-001', subastaId: 'auction1', estado: 'en_subasta' } as any)
      .mockResolvedValueOnce(null) // nextItem
    vi.mocked(prisma.bid.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.item.update).mockResolvedValue({ id: 'item1', estado: 'sin_postor' } as any)

    const res = await POST(makeAuthRequest('POST', '/api/admin/auctions/auction1/items/item1/adjudicate', {}), params)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.purchase).toBeNull()
  })

  it('400 — subasta no activa', async () => {
    vi.mocked(prisma.auction.findUnique).mockResolvedValue({ id: 'auction1', estado: 'finalizada' } as any)

    const res = await POST(makeAuthRequest('POST', '/api/admin/auctions/auction1/items/item1/adjudicate', {}), params)
    expect(res.status).toBe(400)
  })

  it('404 — ítem no encontrado', async () => {
    vi.mocked(prisma.auction.findUnique).mockResolvedValue({ id: 'auction1', estado: 'activa' } as any)
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/admin/auctions/auction1/items/item1/adjudicate', {}), params)
    expect(res.status).toBe(404)
  })
})
