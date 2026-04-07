import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/users/me/payment-methods/credit-card/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const validBody = {
  ultimosCuatro: '4242',
  marca: 'Visa',
  titular: 'Juan Perez',
  mesVencimiento: 12,
  anioVencimiento: new Date().getFullYear() + 1,
  esInternacional: false,
}

describe('POST /api/users/me/payment-methods/credit-card', () => {
  beforeEach(() => vi.clearAllMocks())

  it('201 — crea tarjeta de crédito', async () => {
    vi.mocked(prisma.paymentMethod.create).mockResolvedValue({ id: 'pm1', tipo: 'tarjeta_credito', creditCard: {} } as any)

    const res = await POST(makeAuthRequest('POST', '/api/users/me/payment-methods/credit-card', validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.tipo).toBe('tarjeta_credito')
  })

  it('422 — ultimosCuatro debe tener exactamente 4 dígitos', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/users/me/payment-methods/credit-card', { ...validBody, ultimosCuatro: '42' }))
    expect(res.status).toBe(422)
  })

  it('422 — mes de vencimiento inválido', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/users/me/payment-methods/credit-card', { ...validBody, mesVencimiento: 13 }))
    expect(res.status).toBe(422)
  })
})
