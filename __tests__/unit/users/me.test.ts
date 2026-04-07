import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT, DELETE } from '@/app/api/users/me/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const mockUser = {
  id: 'user-test-id', email: 'test@test.com', nombre: 'Juan', apellido: 'Perez',
  domicilio: 'Calle 1', numeroPais: 1, categoria: 'comun', estado: 'aprobado',
  registroCompletado: true, createdAt: new Date(), penalties: [],
}

describe('GET /api/users/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna perfil del usuario', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    const res = await GET(makeAuthRequest('GET', '/api/users/me'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.email).toBe('test@test.com')
  })

  it('404 — usuario no encontrado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await GET(makeAuthRequest('GET', '/api/users/me'))
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/users/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — actualiza domicilio', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'user-test-id', domicilio: 'Nueva calle', numeroPais: 1 } as any)

    const res = await PUT(makeAuthRequest('PUT', '/api/users/me', { domicilio: 'Nueva calle' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.domicilio).toBe('Nueva calle')
  })

  it('422 — domicilio vacío', async () => {
    const res = await PUT(makeAuthRequest('PUT', '/api/users/me', { domicilio: '' }))
    expect(res.status).toBe(422)
  })
})

describe('DELETE /api/users/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — desactiva la cuenta', async () => {
    vi.mocked(prisma.purchase.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    const res = await DELETE(makeAuthRequest('DELETE', '/api/users/me'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.message).toBe('Account deactivated')
  })

  it('400 — tiene compras pendientes', async () => {
    vi.mocked(prisma.purchase.findFirst).mockResolvedValue({ id: 'p1' } as any)

    const res = await DELETE(makeAuthRequest('DELETE', '/api/users/me'))
    expect(res.status).toBe(400)
  })
})
