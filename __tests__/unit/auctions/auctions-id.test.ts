import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/auctions/[id]/route'
import { prisma } from '@/lib/prisma'
import { makeRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'a1' }) }
const mockAuction = { id: 'a1', nombre: 'Subasta 1', categoria: 'comun', estado: 'programada', rematador: null, specs: [{ clave: 'Material', valor: 'Madera' }], _count: { items: 3 } }

describe('GET /api/auctions/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna subasta', async () => {
    vi.mocked(prisma.auction.findUnique).mockResolvedValue(mockAuction as any)

    const res = await GET(makeRequest('GET', '/api/auctions/a1'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.id).toBe('a1')
    expect(body.data.canJoin).toBe(false)
    expect(body.data.specs).toEqual([{ clave: 'Material', valor: 'Madera' }])
  })

  it('404 — no encontrada', async () => {
    vi.mocked(prisma.auction.findUnique).mockResolvedValue(null)

    const res = await GET(makeRequest('GET', '/api/auctions/a1'), params)
    expect(res.status).toBe(404)
  })
})
