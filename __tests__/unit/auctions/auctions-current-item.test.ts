import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/auctions/[id]/current-item/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'a1' }) }

describe('GET /api/auctions/[id]/current-item', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna item en subasta con highest bid', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({
      id: 'i1', descripcion: 'Item 1', precioBase: 100, images: [], components: [],
    } as any)
    vi.mocked(prisma.bid.findFirst).mockResolvedValue({
      id: 'b1', monto: 110, user: { nombre: 'Juan', apellido: 'Perez' },
    } as any)

    const res = await GET(makeAuthRequest('GET', '/api/auctions/a1/current-item'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.item.id).toBe('i1')
    expect(body.data.highestBid.monto).toBe(110)
  })

  it('404 — sin item en subasta', async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null)

    const res = await GET(makeAuthRequest('GET', '/api/auctions/a1/current-item'), params)
    expect(res.status).toBe(404)
  })
})
