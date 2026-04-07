import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/auctions/[id]/catalog/[itemId]/bids/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'a1', itemId: 'i1' }) }

describe('GET /api/auctions/[id]/catalog/[itemId]/bids', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna bids del item', async () => {
    vi.mocked(prisma.bid.findMany).mockResolvedValue([
      { id: 'b1', monto: 100, user: { nombre: 'Juan', apellido: 'Perez' } },
    ] as any)

    const res = await GET(makeAuthRequest('GET', '/api/auctions/a1/catalog/i1/bids'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
  })

  it('200 — sin bids', async () => {
    vi.mocked(prisma.bid.findMany).mockResolvedValue([])

    const res = await GET(makeAuthRequest('GET', '/api/auctions/a1/catalog/i1/bids'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(0)
  })
})
