import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/users/me/penalties/route'
import { POST } from '@/app/api/users/me/penalties/[id]/pay/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

describe('GET /api/users/me/penalties', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna penalidades', async () => {
    vi.mocked(prisma.penalty.findMany).mockResolvedValue([
      { id: 'pen1', estado: 'pendiente', monto: 500, fechaLimite: new Date(), purchase: { id: 'p1', montoFinal: 1000 } },
    ] as any)

    const res = await GET(makeAuthRequest('GET', '/api/users/me/penalties'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
  })
})

describe('POST /api/users/me/penalties/[id]/pay', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — paga la penalidad', async () => {
    vi.mocked(prisma.penalty.findFirst).mockResolvedValue({ id: 'pen1', userId: 'user-test-id', estado: 'pendiente' } as any)
    vi.mocked(prisma.penalty.update).mockResolvedValue({ id: 'pen1', estado: 'pagada', pagadaEn: new Date() } as any)

    const res = await POST(makeAuthRequest('POST', '/api/users/me/penalties/pen1'), { params: Promise.resolve({ id: 'pen1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.estado).toBe('pagada')
  })

  it('404 — penalidad no encontrada', async () => {
    vi.mocked(prisma.penalty.findFirst).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/users/me/penalties/pen1'), { params: Promise.resolve({ id: 'pen1' }) })
    expect(res.status).toBe(404)
  })

  it('400 — penalidad no está pendiente', async () => {
    vi.mocked(prisma.penalty.findFirst).mockResolvedValue({ id: 'pen1', userId: 'user-test-id', estado: 'pagada' } as any)

    const res = await POST(makeAuthRequest('POST', '/api/users/me/penalties/pen1'), { params: Promise.resolve({ id: 'pen1' }) })
    expect(res.status).toBe(400)
  })
})
