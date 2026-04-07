import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/auctions/[id]/catalog/[itemId]/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'a1', itemId: 'i1' }) }

describe('GET /api/auctions/[id]/catalog/[itemId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna item del catálogo', async () => {
    vi.mocked(prisma.item.findUnique).mockResolvedValue({
      id: 'i1', descripcion: 'Item 1', images: [], components: [], previousOwners: [], duenUser: null,
    } as any)

    const res = await GET(makeAuthRequest('GET', '/api/auctions/a1/catalog/i1'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.id).toBe('i1')
  })

  it('404 — item no encontrado', async () => {
    vi.mocked(prisma.item.findUnique).mockResolvedValue(null)

    const res = await GET(makeAuthRequest('GET', '/api/auctions/a1/catalog/i1'), params)
    expect(res.status).toBe(404)
  })
})
