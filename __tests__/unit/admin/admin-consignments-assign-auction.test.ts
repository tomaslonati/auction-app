import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/admin/consignments/[id]/assign-auction/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'c1' }) }
const validBody = { auctionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', numeroPieza: 'P-001', descripcion: 'Reloj antiguo', precioBase: 1000 }

describe('POST /api/admin/consignments/[id]/assign-auction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('201 — asigna consignación a subasta', async () => {
    vi.mocked(prisma.consignment.findUnique).mockResolvedValue({
      id: 'c1', estado: 'aceptado', userId: 'user1', esCompuesto: false, esObraArte: false,
      artistaDisenador: null, fechaCreacionObra: null, historia: null,
      inspection: { userAcepta: true },
    } as any)
    vi.mocked(prisma.auction.findUnique).mockResolvedValue({ id: validBody.auctionId } as any)
    vi.mocked(prisma.item.create).mockResolvedValue({ id: 'item1', numeroPieza: 'P-001' } as any)
    vi.mocked(prisma.consignmentItem.create).mockResolvedValue({ id: 'ci1' } as any)
    vi.mocked(prisma.consignment.update).mockResolvedValue({ id: 'c1', estado: 'subastado' } as any)

    const res = await POST(makeAuthRequest('POST', '/api/admin/consignments/c1/assign-auction', validBody), params)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.item.numeroPieza).toBe('P-001')
  })

  it('404 — consignación no encontrada', async () => {
    vi.mocked(prisma.consignment.findUnique).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/admin/consignments/c1/assign-auction', validBody), params)
    expect(res.status).toBe(404)
  })

  it('400 — consignación no aceptada por usuario', async () => {
    vi.mocked(prisma.consignment.findUnique).mockResolvedValue({
      id: 'c1', estado: 'aceptado', inspection: { userAcepta: false },
    } as any)

    const res = await POST(makeAuthRequest('POST', '/api/admin/consignments/c1/assign-auction', validBody), params)
    expect(res.status).toBe(400)
  })

  it('404 — subasta no encontrada', async () => {
    vi.mocked(prisma.consignment.findUnique).mockResolvedValue({
      id: 'c1', estado: 'aceptado', inspection: { userAcepta: true },
    } as any)
    vi.mocked(prisma.auction.findUnique).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/admin/consignments/c1/assign-auction', validBody), params)
    expect(res.status).toBe(404)
  })

  it('422 — body inválido', async () => {
    vi.mocked(prisma.consignment.findUnique).mockResolvedValue({
      id: 'c1', estado: 'aceptado', inspection: { userAcepta: true },
    } as any)

    const res = await POST(makeAuthRequest('POST', '/api/admin/consignments/c1/assign-auction', { auctionId: 'not-uuid' }), params)
    expect(res.status).toBe(422)
  })
})
