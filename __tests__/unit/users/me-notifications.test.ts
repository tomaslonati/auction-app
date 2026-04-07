import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/users/me/notifications/route'
import { PATCH } from '@/app/api/users/me/notifications/[id]/read/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

describe('GET /api/users/me/notifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna lista de notificaciones', async () => {
    vi.mocked(prisma.notification.findMany).mockResolvedValue([
      { id: 'n1', tipo: 'adjudicacion', titulo: 'test', leida: false },
    ] as any)

    const res = await GET(makeAuthRequest('GET', '/api/users/me/notifications'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
  })

  it('200 — retorna lista vacía', async () => {
    vi.mocked(prisma.notification.findMany).mockResolvedValue([])

    const res = await GET(makeAuthRequest('GET', '/api/users/me/notifications'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(0)
  })
})

describe('PATCH /api/users/me/notifications/[id]/read', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — marca notificación como leída', async () => {
    vi.mocked(prisma.notification.findFirst).mockResolvedValue({ id: 'n1', userId: 'user-test-id', leida: false } as any)
    vi.mocked(prisma.notification.update).mockResolvedValue({ id: 'n1', leida: true, leidaEn: new Date() } as any)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/users/me/notifications/n1'), { params: Promise.resolve({ id: 'n1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.leida).toBe(true)
  })

  it('404 — notificación no encontrada', async () => {
    vi.mocked(prisma.notification.findFirst).mockResolvedValue(null)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/users/me/notifications/n1'), { params: Promise.resolve({ id: 'n1' }) })
    expect(res.status).toBe(404)
  })
})
