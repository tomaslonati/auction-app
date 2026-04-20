import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/users/me/active-bids/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const mockAuction = { id: 'a1', nombre: 'Subasta Activa', categoria: 'comun', moneda: 'pesos', estado: 'activa' }
const mockItem = { id: 'i1', descripcion: 'Reloj Longines', numeroPieza: 'P-001', precioBase: 10000 }

describe('GET /api/users/me/active-bids', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — sin pujas activas retorna array vacío', async () => {
    vi.mocked(prisma.bid.findMany).mockResolvedValueOnce([])

    const res = await GET(makeAuthRequest('GET', '/api/users/me/active-bids'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(0)
  })

  it('200 — situacion ganando cuando la puja del usuario es la confirmada top', async () => {
    vi.mocked(prisma.bid.findMany)
      // 1er llamado: pujas del usuario en subastas activas
      .mockResolvedValueOnce([
        { id: 'b1', subastaId: 'a1', itemId: 'i1', userId: 'user-test-id', monto: 15000, estado: 'confirmada', createdAt: new Date(), subasta: mockAuction, item: mockItem },
      ] as any)
      // 2do llamado: top bids por ítem
      .mockResolvedValueOnce([
        { id: 'b1', itemId: 'i1', userId: 'user-test-id', monto: 15000, estado: 'confirmada' },
      ] as any)

    const res = await GET(makeAuthRequest('GET', '/api/users/me/active-bids'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].items[0].situacion).toBe('ganando')
    expect(body.data[0].items[0].mejorPujaActual).toBe(15000)
  })

  it('200 — situacion superada cuando otro usuario tiene la puja top', async () => {
    vi.mocked(prisma.bid.findMany)
      .mockResolvedValueOnce([
        { id: 'b1', subastaId: 'a1', itemId: 'i1', userId: 'user-test-id', monto: 15000, estado: 'superada', createdAt: new Date(), subasta: mockAuction, item: mockItem },
      ] as any)
      .mockResolvedValueOnce([
        { id: 'b2', itemId: 'i1', userId: 'otro-user', monto: 16000, estado: 'confirmada' },
      ] as any)

    const res = await GET(makeAuthRequest('GET', '/api/users/me/active-bids'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data[0].items[0].situacion).toBe('superada')
    expect(body.data[0].items[0].mejorPujaActual).toBe(16000)
  })

  it('200 — situacion pendiente cuando la puja está enviada', async () => {
    vi.mocked(prisma.bid.findMany)
      .mockResolvedValueOnce([
        { id: 'b1', subastaId: 'a1', itemId: 'i1', userId: 'user-test-id', monto: 15000, estado: 'enviada', createdAt: new Date(), subasta: mockAuction, item: mockItem },
      ] as any)
      .mockResolvedValueOnce([]) // sin confirmadas aún

    const res = await GET(makeAuthRequest('GET', '/api/users/me/active-bids'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data[0].items[0].situacion).toBe('pendiente')
    expect(body.data[0].items[0].mejorPujaActual).toBeNull()
  })

  it('200 — múltiples ítems en la misma subasta con distintas situaciones', async () => {
    const mockItem2 = { id: 'i2', descripcion: 'Pintura', numeroPieza: 'P-002', precioBase: 5000 }

    vi.mocked(prisma.bid.findMany)
      .mockResolvedValueOnce([
        { id: 'b1', subastaId: 'a1', itemId: 'i1', userId: 'user-test-id', monto: 15000, estado: 'confirmada', createdAt: new Date(), subasta: mockAuction, item: mockItem },
        { id: 'b2', subastaId: 'a1', itemId: 'i2', userId: 'user-test-id', monto: 8000, estado: 'superada', createdAt: new Date(), subasta: mockAuction, item: mockItem2 },
      ] as any)
      .mockResolvedValueOnce([
        { id: 'b1', itemId: 'i1', userId: 'user-test-id', monto: 15000, estado: 'confirmada' },
        { id: 'b3', itemId: 'i2', userId: 'otro-user', monto: 9000, estado: 'confirmada' },
      ] as any)

    const res = await GET(makeAuthRequest('GET', '/api/users/me/active-bids'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].items).toHaveLength(2)

    const ganando = body.data[0].items.find((i: any) => i.item.id === 'i1')
    const superada = body.data[0].items.find((i: any) => i.item.id === 'i2')

    expect(ganando.situacion).toBe('ganando')
    expect(superada.situacion).toBe('superada')
  })
})
