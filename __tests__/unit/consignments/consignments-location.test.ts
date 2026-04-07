import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/consignments/[id]/location/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'c1' }) }

describe('GET /api/consignments/[id]/location', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna ubicación en depósito', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({
      id: 'c1',
      location: {
        deposit: { id: 'd1', nombre: 'Depósito Central', direccion: 'Av. 1' },
        sector: 'A1',
        fechaIngreso: new Date('2026-01-01'),
      },
    } as any)

    const res = await GET(makeAuthRequest('GET', '/api/consignments/c1/location'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.deposit.nombre).toBe('Depósito Central')
    expect(body.data.sector).toBe('A1')
  })

  it('404 — consignación no encontrada', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue(null)

    const res = await GET(makeAuthRequest('GET', '/api/consignments/c1/location'), params)
    expect(res.status).toBe(404)
  })

  it('404 — no está en depósito aún', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({ id: 'c1', location: null } as any)

    const res = await GET(makeAuthRequest('GET', '/api/consignments/c1/location'), params)
    expect(res.status).toBe(404)
  })
})
