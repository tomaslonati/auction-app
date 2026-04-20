import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/login/route'
import { prisma } from '@/lib/prisma'
import { makeRequest } from '../../helpers'

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna accessToken con usuario aprobado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ estado: 'aprobado' } as any)

    const res = await POST(makeRequest('POST', '/api/auth/login', { email: 'test@test.com', password: 'password' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.accessToken).toBe('mock-token')
  })

  it('403 — usuario bloqueado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ estado: 'bloqueado' } as any)

    const res = await POST(makeRequest('POST', '/api/auth/login', { email: 'test@test.com', password: 'password' }))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toContain('bloqueada')
  })

  it('403 — usuario multado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ estado: 'multado' } as any)

    const res = await POST(makeRequest('POST', '/api/auth/login', { email: 'test@test.com', password: 'password' }))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toContain('multas')
  })

  it('403 — usuario en proceso judicial', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ estado: 'proceso_judicial' } as any)

    const res = await POST(makeRequest('POST', '/api/auth/login', { email: 'test@test.com', password: 'password' }))
    expect(res.status).toBe(403)
  })

  it('422 — email inválido', async () => {
    const res = await POST(makeRequest('POST', '/api/auth/login', { email: 'no-email', password: 'pass' }))
    expect(res.status).toBe(422)
  })

  it('422 — password vacía', async () => {
    const res = await POST(makeRequest('POST', '/api/auth/login', { email: 'test@test.com', password: '' }))
    expect(res.status).toBe(422)
  })
})
