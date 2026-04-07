import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/consignments/[id]/inspection-response/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'c1' }) }

const mockConsignmentAccepted = {
  id: 'c1', userId: 'user-test-id',
  inspection: { id: 'ins1', resultado: 'aceptado', userAcepta: null, costoDevolucion: null },
}

describe('POST /api/consignments/[id]/inspection-response', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — acepta la inspección', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue(mockConsignmentAccepted as any)
    vi.mocked(prisma.consignmentInspection.update).mockResolvedValue({} as any)
    vi.mocked(prisma.consignment.update).mockResolvedValue({ id: 'c1', estado: 'aceptado' } as any)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/inspection-response', { userAcepta: true }), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.consignment.estado).toBe('aceptado')
  })

  it('200 — rechaza la inspección', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue(mockConsignmentAccepted as any)
    vi.mocked(prisma.consignmentInspection.update).mockResolvedValue({} as any)
    vi.mocked(prisma.consignment.update).mockResolvedValue({ id: 'c1', estado: 'rechazado' } as any)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/inspection-response', { userAcepta: false }), params)
    expect(res.status).toBe(200)
  })

  it('404 — consignación no encontrada', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/inspection-response', { userAcepta: true }), params)
    expect(res.status).toBe(404)
  })

  it('400 — sin inspección aceptada', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({
      id: 'c1', inspection: null,
    } as any)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/inspection-response', { userAcepta: true }), params)
    expect(res.status).toBe(400)
  })

  it('409 — ya respondió', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({
      id: 'c1', inspection: { id: 'ins1', resultado: 'aceptado', userAcepta: true },
    } as any)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/inspection-response', { userAcepta: true }), params)
    expect(res.status).toBe(409)
  })
})
