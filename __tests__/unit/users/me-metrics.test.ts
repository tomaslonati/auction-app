import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/users/me/metrics/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

describe('GET /api/users/me/metrics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna métricas del usuario', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ categoria: 'comun' } as any)
    vi.mocked(prisma.auctionSession.findMany).mockResolvedValue([
      { auctionId: 'a1', auction: { categoria: 'comun' } },
    ] as any)
    vi.mocked(prisma.purchase.findMany).mockResolvedValue([
      { montoFinal: 100, comision: 10, costoEnvio: 5, subastaId: 'a1' },
    ] as any)
    vi.mocked(prisma.bid.findMany).mockResolvedValue([
      { monto: 90, subastaId: 'a1' },
    ] as any)

    const res = await GET(makeAuthRequest('GET', '/api/users/me/metrics'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.totalSubastas).toBe(1)
    expect(body.data.itemsGanados).toBe(1)
    expect(body.data.ratioExito).toBe(1)
  })

  it('200 — retorna ceros si no participó', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ categoria: null } as any)
    vi.mocked(prisma.auctionSession.findMany).mockResolvedValue([])
    vi.mocked(prisma.purchase.findMany).mockResolvedValue([])
    vi.mocked(prisma.bid.findMany).mockResolvedValue([])

    const res = await GET(makeAuthRequest('GET', '/api/users/me/metrics'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.totalSubastas).toBe(0)
    expect(body.data.ratioExito).toBe(0)
  })
})
