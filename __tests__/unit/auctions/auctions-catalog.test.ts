import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/auctions/[id]/catalog/route'
import { prisma } from '@/lib/prisma'
import { makeRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'a1' }) }

describe('GET /api/auctions/[id]/catalog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna catálogo sin precio base (no autenticado)', async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      { id: 'i1', numeroPieza: '001', descripcion: 'Item 1', estado: 'pendiente', esObraArte: false, esCompuesto: false, images: [] },
    ] as any)

    const res = await GET(makeRequest('GET', '/api/auctions/a1/catalog'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
  })

  it('200 — lista vacía', async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([])

    const res = await GET(makeRequest('GET', '/api/auctions/a1/catalog'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(0)
  })
})
