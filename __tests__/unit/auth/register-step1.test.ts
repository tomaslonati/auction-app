import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/register/step1/route'
import { prisma } from '@/lib/prisma'
import { makeRequest } from '../../helpers'

const validBody = {
  email: 'test@test.com',
  nombre: 'Juan',
  apellido: 'Perez',
  domicilio: 'Calle 123',
  numeroPais: 1,
}

const mockPais = { numero: 1, nombre: 'Argentina', nombreCorto: 'AR', capital: 'Buenos Aires', nacionalidad: 'Argentina', idiomas: 'Español' }
const mockUser = { id: 'supabase-user-id', estado: 'pendiente_verificacion' }

describe('POST /api/auth/register/step1', () => {
  beforeEach(() => vi.clearAllMocks())

  it('201 — crea usuario y retorna userId', async () => {
    vi.mocked(prisma.pais.findUnique).mockResolvedValue(mockPais as any)
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any)

    const res = await POST(makeRequest('POST', '/api/auth/register/step1', validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.userId).toBe('supabase-user-id')
    expect(body.error).toBeNull()
  })

  it('422 — faltan campos requeridos', async () => {
    const res = await POST(makeRequest('POST', '/api/auth/register/step1', { nombre: 'Juan' }))
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.data).toBeNull()
  })

  it('422 — email inválido', async () => {
    const res = await POST(makeRequest('POST', '/api/auth/register/step1', { ...validBody, email: 'no-es-email' }))
    expect(res.status).toBe(422)
  })

  it('422 — país no encontrado', async () => {
    vi.mocked(prisma.pais.findUnique).mockResolvedValue(null)

    const res = await POST(makeRequest('POST', '/api/auth/register/step1', validBody))
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.error.numeroPais).toBeDefined()
  })
})
