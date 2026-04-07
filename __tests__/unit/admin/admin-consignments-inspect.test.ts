import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/admin/consignments/[id]/inspect/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'c1' }) }
const consignment = { id: 'c1', userId: 'user1', user: { id: 'user1', nombre: 'Juan' } }

describe('POST /api/admin/consignments/[id]/inspect', () => {
  beforeEach(() => vi.clearAllMocks())

  it('201 — inspección aceptada', async () => {
    vi.mocked(prisma.consignment.findUnique).mockResolvedValue(consignment as any)
    vi.mocked(prisma.consignmentInspection.create).mockResolvedValue({ id: 'insp1', resultado: 'aceptado' } as any)
    vi.mocked(prisma.consignment.update).mockResolvedValue({ id: 'c1', estado: 'aceptado' } as any)
    vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'n1' } as any)

    const body = { resultado: 'aceptado', valorBaseAsignado: 1000, comisionPorcentaje: 10 }
    const res = await POST(makeAuthRequest('POST', '/api/admin/consignments/c1/inspect', body), params)
    const resBody = await res.json()

    expect(res.status).toBe(201)
    expect(resBody.data.resultado).toBe('aceptado')
  })

  it('201 — inspección rechazada', async () => {
    vi.mocked(prisma.consignment.findUnique).mockResolvedValue(consignment as any)
    vi.mocked(prisma.consignmentInspection.create).mockResolvedValue({ id: 'insp1', resultado: 'rechazado' } as any)
    vi.mocked(prisma.consignment.update).mockResolvedValue({ id: 'c1', estado: 'rechazado' } as any)
    vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'n1' } as any)

    const body = { resultado: 'rechazado', motivoRechazo: 'Mal estado' }
    const res = await POST(makeAuthRequest('POST', '/api/admin/consignments/c1/inspect', body), params)
    expect(res.status).toBe(201)
  })

  it('404 — consignación no encontrada', async () => {
    vi.mocked(prisma.consignment.findUnique).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/admin/consignments/c1/inspect', { resultado: 'rechazado', motivoRechazo: 'x' }), params)
    expect(res.status).toBe(404)
  })

  it('422 — body inválido', async () => {
    vi.mocked(prisma.consignment.findUnique).mockResolvedValue(consignment as any)

    const res = await POST(makeAuthRequest('POST', '/api/admin/consignments/c1/inspect', { resultado: 'aceptado' }), params)
    expect(res.status).toBe(422)
  })
})
