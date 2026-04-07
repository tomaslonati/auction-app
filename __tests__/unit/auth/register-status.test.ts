import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/auth/register/status/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

describe('GET /api/auth/register/status', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna estado y registroCompletado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ estado: 'pendiente_verificacion', registroCompletado: false } as any)

    const res = await GET(makeAuthRequest('GET', '/api/auth/register/status'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.estado).toBe('pendiente_verificacion')
    expect(body.data.registroCompletado).toBe(false)
  })

  it('404 — usuario no encontrado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await GET(makeAuthRequest('GET', '/api/auth/register/status'))
    expect(res.status).toBe(404)
  })
})
