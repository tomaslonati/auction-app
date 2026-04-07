import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/register/complete/route'
import { prisma } from '@/lib/prisma'
import { makeRequest } from '../../helpers'

const validBody = { userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', password: 'password123' }

describe('POST /api/auth/register/complete', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — completa el registro', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: validBody.userId, estado: 'aprobado', registroCompletado: false } as any)
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    const res = await POST(makeRequest('POST', '/api/auth/register/complete', validBody))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.message).toBeDefined()
  })

  it('422 — userId no es UUID', async () => {
    const res = await POST(makeRequest('POST', '/api/auth/register/complete', { userId: 'no-uuid', password: 'password123' }))
    expect(res.status).toBe(422)
  })

  it('422 — contraseña muy corta', async () => {
    const res = await POST(makeRequest('POST', '/api/auth/register/complete', { userId: validBody.userId, password: '123' }))
    expect(res.status).toBe(422)
  })

  it('404 — usuario no encontrado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await POST(makeRequest('POST', '/api/auth/register/complete', validBody))
    expect(res.status).toBe(404)
  })

  it('403 — usuario no aprobado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: validBody.userId, estado: 'pendiente_verificacion', registroCompletado: false } as any)

    const res = await POST(makeRequest('POST', '/api/auth/register/complete', validBody))
    expect(res.status).toBe(403)
  })

  it('400 — registro ya completado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: validBody.userId, estado: 'aprobado', registroCompletado: true } as any)

    const res = await POST(makeRequest('POST', '/api/auth/register/complete', validBody))
    expect(res.status).toBe(400)
  })
})
