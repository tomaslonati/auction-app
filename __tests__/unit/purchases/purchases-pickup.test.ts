import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '@/app/api/purchases/[id]/pickup/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'pur1' }) }

describe('PATCH /api/purchases/[id]/pickup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — declara retiro personal', async () => {
    vi.mocked(prisma.purchase.findFirst).mockResolvedValue({ id: 'pur1', estadoPago: 'pagado', retiroPersonal: false } as any)
    vi.mocked(prisma.purchase.update).mockResolvedValue({ id: 'pur1', retiroPersonal: true } as any)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/purchases/pur1/pickup'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.retiroPersonal).toBe(true)
    expect(body.data.warning).toBeDefined()
  })

  it('404 — compra no encontrada', async () => {
    vi.mocked(prisma.purchase.findFirst).mockResolvedValue(null)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/purchases/pur1/pickup'), params)
    expect(res.status).toBe(404)
  })

  it('422 — compra no pagada', async () => {
    vi.mocked(prisma.purchase.findFirst).mockResolvedValue({ id: 'pur1', estadoPago: 'pendiente', retiroPersonal: false } as any)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/purchases/pur1/pickup'), params)
    expect(res.status).toBe(422)
  })

  it('400 — retiro ya declarado', async () => {
    vi.mocked(prisma.purchase.findFirst).mockResolvedValue({ id: 'pur1', estadoPago: 'pagado', retiroPersonal: true } as any)

    const res = await PATCH(makeAuthRequest('PATCH', '/api/purchases/pur1/pickup'), params)
    expect(res.status).toBe(400)
  })
})
