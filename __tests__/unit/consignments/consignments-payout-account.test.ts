import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/consignments/[id]/payout-account/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'c1' }) }
const validBody = { banco: 'Galicia', numeroCuenta: '1234567', titular: 'Juan Perez', numeroPaisId: 1, moneda: 'ARS' }

describe('POST /api/consignments/[id]/payout-account', () => {
  beforeEach(() => vi.clearAllMocks())

  it('201 — crea cuenta de cobro', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({ id: 'c1', consignmentItems: [] } as any)
    vi.mocked(prisma.pais.findUnique).mockResolvedValue({ numero: 1, nombre: 'Argentina' } as any)
    vi.mocked(prisma.payoutAccount.create).mockResolvedValue({ id: 'pa1', ...validBody } as any)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/payout-account', validBody), params)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.id).toBe('pa1')
  })

  it('404 — consignación no encontrada', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/payout-account', validBody), params)
    expect(res.status).toBe(404)
  })

  it('422 — país no encontrado', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({ id: 'c1', consignmentItems: [] } as any)
    vi.mocked(prisma.pais.findUnique).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/payout-account', validBody), params)
    expect(res.status).toBe(422)
  })

  it('422 — faltan campos', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({ id: 'c1', consignmentItems: [] } as any)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/payout-account', { banco: 'Galicia' }), params)
    expect(res.status).toBe(422)
  })
})
