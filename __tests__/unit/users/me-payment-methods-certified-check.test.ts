import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/users/me/payment-methods/certified-check/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const validBody = {
  banco: 'Galicia',
  numeroCheque: 'CH-001',
  monto: 5000,
  fechaVencimiento: new Date(Date.now() + 86400000 * 30).toISOString(),
}

describe('POST /api/users/me/payment-methods/certified-check', () => {
  beforeEach(() => vi.clearAllMocks())

  it('201 — crea cheque certificado', async () => {
    vi.mocked(prisma.paymentMethod.create).mockResolvedValue({ id: 'pm1', tipo: 'cheque_certificado', certifiedCheck: { monto: 5000, montoDisponible: 5000 } } as any)

    const res = await POST(makeAuthRequest('POST', '/api/users/me/payment-methods/certified-check', validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.tipo).toBe('cheque_certificado')
  })

  it('422 — monto negativo', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/users/me/payment-methods/certified-check', { ...validBody, monto: -100 }))
    expect(res.status).toBe(422)
  })

  it('422 — fecha de vencimiento inválida', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/users/me/payment-methods/certified-check', { ...validBody, fechaVencimiento: 'no-es-fecha' }))
    expect(res.status).toBe(422)
  })
})
