import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/auctions/route'
import { prisma } from '@/lib/prisma'
import { makeRequest } from '../../helpers'

const mockAuctions = [
  { id: 'a1', nombre: 'Subasta 1', estado: 'programada', categoria: 'comun', rematador: null, items: [], _count: { items: 0 } },
]

describe('GET /api/auctions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna lista de subastas', async () => {
    vi.mocked(prisma.auction.findMany).mockResolvedValue(mockAuctions as any)

    const res = await GET(makeRequest('GET', '/api/auctions'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
  })

  it('200 — lista vacía', async () => {
    vi.mocked(prisma.auction.findMany).mockResolvedValue([])

    const res = await GET(makeRequest('GET', '/api/auctions'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(0)
  })
})
