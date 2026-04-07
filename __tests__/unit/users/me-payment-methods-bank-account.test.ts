import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/users/me/payment-methods/bank-account/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const validBody = { banco: 'Galicia', numeroCuenta: '1234567', titular: 'Juan Perez', numeroPaisId: 1, moneda: 'ARS' }
const mockPais = { numero: 1, nombre: 'Argentina', capital: '', nacionalidad: '', idiomas: '', nombreCorto: null }

describe('POST /api/users/me/payment-methods/bank-account', () => {
  beforeEach(() => vi.clearAllMocks())

  it('201 — crea cuenta bancaria local', async () => {
    vi.mocked(prisma.pais.findUnique).mockResolvedValue(mockPais as any)
    vi.mocked(prisma.paymentMethod.create).mockResolvedValue({ id: 'pm1', tipo: 'cuenta_bancaria', esInternacional: false, bankAccount: {} } as any)

    const res = await POST(makeAuthRequest('POST', '/api/users/me/payment-methods/bank-account', validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.tipo).toBe('cuenta_bancaria')
  })

  it('201 — marca como internacional cuando no es Argentina', async () => {
    vi.mocked(prisma.pais.findUnique).mockResolvedValue({ ...mockPais, nombre: 'España' } as any)
    vi.mocked(prisma.paymentMethod.create).mockResolvedValue({ id: 'pm2', tipo: 'cuenta_bancaria', esInternacional: true, bankAccount: {} } as any)

    const res = await POST(makeAuthRequest('POST', '/api/users/me/payment-methods/bank-account', { ...validBody, numeroPaisId: 2 }))
    expect(res.status).toBe(201)
  })

  it('422 — faltan campos', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/users/me/payment-methods/bank-account', { banco: 'Galicia' }))
    expect(res.status).toBe(422)
  })

  it('422 — país no encontrado', async () => {
    vi.mocked(prisma.pais.findUnique).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/users/me/payment-methods/bank-account', validBody))
    expect(res.status).toBe(422)
  })
})
