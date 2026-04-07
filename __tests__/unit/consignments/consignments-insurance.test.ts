import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/consignments/[id]/insurance/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'c1' }) }

describe('GET /api/consignments/[id]/insurance', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna pólizas de seguro', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({
      id: 'c1',
      insurancePolicies: [{
        policy: { numeroPoliza: 'P-001', compania: 'Seguros SA', telefonoCompania: null, emailCompania: null, valorAsegurado: 5000, fechaInicio: new Date(), fechaVencimiento: new Date() },
      }],
    } as any)

    const res = await GET(makeAuthRequest('GET', '/api/consignments/c1/insurance'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].numeroPoliza).toBe('P-001')
  })

  it('404 — consignación no encontrada', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue(null)

    const res = await GET(makeAuthRequest('GET', '/api/consignments/c1/insurance'), params)
    expect(res.status).toBe(404)
  })
})
