import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '@/app/api/admin/payment-methods/[id]/verify/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'pm1' }) }

describe('PATCH /api/admin/payment-methods/[id]/verify', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — verifica método de pago', async () => {
    vi.mocked(prisma.paymentMethod.findUnique).mockResolvedValue({ id: 'pm1', userId: 'user1' } as any)
    vi.mocked(prisma.paymentMethod.update).mockResolvedValue({ id: 'pm1', estado: 'verificado' } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ registroCompletado: true } as any)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/admin/payment-methods/pm1/verify', { estado: 'verificado' }), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.estado).toBe('verificado')
  })

  it('200 — rechaza método de pago', async () => {
    vi.mocked(prisma.paymentMethod.findUnique).mockResolvedValue({ id: 'pm1', userId: 'user1' } as any)
    vi.mocked(prisma.paymentMethod.update).mockResolvedValue({ id: 'pm1', estado: 'rechazado' } as any)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/admin/payment-methods/pm1/verify', { estado: 'rechazado' }), params)
    expect(res.status).toBe(200)
  })

  it('200 — verifica y completa registro si pendiente', async () => {
    vi.mocked(prisma.paymentMethod.findUnique).mockResolvedValue({ id: 'pm1', userId: 'user1' } as any)
    vi.mocked(prisma.paymentMethod.update).mockResolvedValue({ id: 'pm1', estado: 'verificado' } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ registroCompletado: false } as any)
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'user1', registroCompletado: true } as any)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/admin/payment-methods/pm1/verify', { estado: 'verificado' }), params)
    expect(res.status).toBe(200)
    expect(prisma.user.update).toHaveBeenCalled()
  })

  it('404 — método de pago no encontrado', async () => {
    vi.mocked(prisma.paymentMethod.findUnique).mockResolvedValue(null)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/admin/payment-methods/pm1/verify', { estado: 'verificado' }), params)
    expect(res.status).toBe(404)
  })

  it('422 — estado inválido', async () => {
    const res = await PATCH(makeAuthRequest('PATCH', '/api/admin/payment-methods/pm1/verify', { estado: 'pendiente' }), params)
    expect(res.status).toBe(422)
  })
})
