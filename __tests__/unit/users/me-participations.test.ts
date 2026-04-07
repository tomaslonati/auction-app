import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/users/me/participations/route'
import { GET as GETAuction } from '@/app/api/users/me/participations/[auctionId]/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

describe('GET /api/users/me/participations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna participaciones', async () => {
    vi.mocked(prisma.auctionSession.findMany).mockResolvedValue([
      { auctionId: 'a1', auction: { id: 'a1', nombre: 'Subasta 1', fechaInicio: new Date(), categoria: 'comun', moneda: 'pesos' } },
    ] as any)
    vi.mocked(prisma.bid.findMany).mockResolvedValue([])
    vi.mocked(prisma.purchase.findMany).mockResolvedValue([])

    const res = await GET(makeAuthRequest('GET', '/api/users/me/participations'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.participations).toHaveLength(1)
    expect(body.data.totals.totalSubastas).toBe(1)
  })
})

describe('GET /api/users/me/participations/[auctionId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna bids agrupados por item', async () => {
    vi.mocked(prisma.bid.findMany).mockResolvedValue([
      { itemId: 'i1', subastaId: 'a1', monto: 100, item: { id: 'i1', descripcion: 'Item 1', numeroPieza: '001' } },
    ] as any)
    vi.mocked(prisma.purchase.findMany).mockResolvedValue([])

    const res = await GETAuction(makeAuthRequest('GET', '/api/users/me/participations/a1'), { params: Promise.resolve({ auctionId: 'a1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].won).toBe(false)
  })
})
