import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '@/app/api/admin/users/[id]/category/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'user1' }) }

describe('PATCH /api/admin/users/[id]/category', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — actualiza categoría', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user1', estado: 'aprobado', categoria: null, registroCompletado: true, email: 'a@b.com', nombre: 'Juan' } as any)
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'user1', categoria: 'oro', estado: 'aprobado' } as any)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/admin/users/user1/category', { categoria: 'oro' }), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.categoria).toBe('oro')
  })

  it('200 — actualiza estado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user1', estado: 'pendiente_verificacion', categoria: null, registroCompletado: false, email: 'a@b.com', nombre: 'Juan' } as any)
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'user1', estado: 'aprobado' } as any)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/admin/users/user1/category', { estado: 'aprobado' }), params)
    expect(res.status).toBe(200)
  })

  it('404 — usuario no encontrado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/admin/users/user1/category', { categoria: 'oro' }), params)
    expect(res.status).toBe(404)
  })

  it('422 — categoría inválida', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user1' } as any)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/admin/users/user1/category', { categoria: 'diamante' }), params)
    expect(res.status).toBe(422)
  })
})
