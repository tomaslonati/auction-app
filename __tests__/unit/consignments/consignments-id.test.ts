import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/consignments/[id]/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'c1' }) }

describe('GET /api/consignments/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna consignación', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({
      id: 'c1', descripcion: 'Reloj', estado: 'en_evaluacion', photos: [], specs: [{ clave: 'Material', valor: 'Oro' }], inspection: null, location: null, consignmentItems: [],
    } as any)

    const res = await GET(makeAuthRequest('GET', '/api/consignments/c1'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.id).toBe('c1')
    expect(body.data.specs).toEqual([{ clave: 'Material', valor: 'Oro' }])
  })

  it('404 — no encontrada', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue(null)

    const res = await GET(makeAuthRequest('GET', '/api/consignments/c1'), params)
    expect(res.status).toBe(404)
  })
})
