import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auctions/[id]/join/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'a1' }) }

describe('POST /api/auctions/[id]/join', () => {
  beforeEach(() => vi.clearAllMocks())

  it('201 — se une a la subasta', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ estado: 'aprobado', categoria: 'comun' } as any)
    vi.mocked(prisma.auction.findUnique).mockResolvedValue({ id: 'a1', categoria: 'comun' } as any)
    vi.mocked(prisma.penalty.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.auctionSession.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.auctionSession.create).mockResolvedValue({ id: 's1', userId: 'user-test-id', auctionId: 'a1' } as any)
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.bid.findFirst).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/auctions/a1/join'), params)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.session.id).toBe('s1')
  })

  it('404 — subasta no encontrada', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ estado: 'aprobado', categoria: 'comun' } as any)
    vi.mocked(prisma.auction.findUnique).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/auctions/a1/join'), params)
    expect(res.status).toBe(404)
  })

  it('403 — usuario no aprobado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ estado: 'pendiente_verificacion', categoria: null } as any)
    vi.mocked(prisma.auction.findUnique).mockResolvedValue({ id: 'a1', categoria: 'comun' } as any)

    const res = await POST(makeAuthRequest('POST', '/api/auctions/a1/join'), params)
    expect(res.status).toBe(403)
  })

  it('403 — tiene penalidades pendientes', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ estado: 'aprobado', categoria: 'comun' } as any)
    vi.mocked(prisma.auction.findUnique).mockResolvedValue({ id: 'a1', categoria: 'comun' } as any)
    vi.mocked(prisma.penalty.findFirst).mockResolvedValue({ id: 'pen1', estado: 'pendiente' } as any)

    const res = await POST(makeAuthRequest('POST', '/api/auctions/a1/join'), params)
    expect(res.status).toBe(403)
  })

  it('409 — ya tiene sesión activa', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ estado: 'aprobado', categoria: 'comun' } as any)
    vi.mocked(prisma.auction.findUnique).mockResolvedValue({ id: 'a1', categoria: 'comun' } as any)
    vi.mocked(prisma.penalty.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.auctionSession.findFirst).mockResolvedValue({ id: 's1' } as any)

    const res = await POST(makeAuthRequest('POST', '/api/auctions/a1/join'), params)
    expect(res.status).toBe(409)
  })
})
