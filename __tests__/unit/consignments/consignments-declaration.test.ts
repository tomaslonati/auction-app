import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/consignments/[id]/declaration/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'c1' }) }
const validBody = { declaraTitularidad: true, aceptaDevolucionConCargo: true }

describe('POST /api/consignments/[id]/declaration', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — envía declaración con 6+ fotos', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({ id: 'c1' } as any)
    vi.mocked(prisma.consignmentPhoto.count).mockResolvedValue(6)
    vi.mocked(prisma.consignment.update).mockResolvedValue({ id: 'c1', estado: 'en_evaluacion' } as any)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/declaration', validBody), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.estado).toBe('en_evaluacion')
  })

  it('422 — menos de 6 fotos', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({ id: 'c1' } as any)
    vi.mocked(prisma.consignmentPhoto.count).mockResolvedValue(3)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/declaration', validBody), params)
    expect(res.status).toBe(422)
  })

  it('422 — no acepta condiciones', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({ id: 'c1' } as any)
    vi.mocked(prisma.consignmentPhoto.count).mockResolvedValue(6)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/declaration', { declaraTitularidad: false, aceptaDevolucionConCargo: true }), params)
    expect(res.status).toBe(422)
  })

  it('404 — consignación no encontrada', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/declaration', validBody), params)
    expect(res.status).toBe(404)
  })
})
