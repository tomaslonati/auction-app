import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/purchases/[id]/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'pur1' }) }

describe('GET /api/purchases/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna compra del usuario', async () => {
    vi.mocked(prisma.purchase.findFirst).mockResolvedValue({
      id: 'pur1', montoFinal: 500,
      item: { id: 'i1', descripcion: 'Reloj', numeroPieza: '001' },
      paymentMethod: { bankAccount: null, creditCard: null, certifiedCheck: null },
    } as any)

    const res = await GET(makeAuthRequest('GET', '/api/purchases/pur1'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.id).toBe('pur1')
  })

  it('404 — compra no encontrada o no pertenece al usuario', async () => {
    vi.mocked(prisma.purchase.findFirst).mockResolvedValue(null)

    const res = await GET(makeAuthRequest('GET', '/api/purchases/pur1'), params)
    expect(res.status).toBe(404)
  })
})
