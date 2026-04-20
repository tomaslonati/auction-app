import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PUT } from '@/app/api/consignments/[id]/specs/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'c1' }) }
const validSpecs = [{ clave: 'Material', valor: 'Oro' }, { clave: 'Peso', valor: '150g' }]

describe('PUT /api/consignments/[id]/specs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — reemplaza specs', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({ id: 'c1' } as any)
    vi.mocked(prisma.consignmentSpec.deleteMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.consignmentSpec.createMany).mockResolvedValue({ count: 2 })
    vi.mocked(prisma.consignmentSpec.findMany).mockResolvedValue(validSpecs as any)

    const res = await PUT(makeAuthRequest('PUT', '/api/consignments/c1/specs', { specs: validSpecs }), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(2)
    expect(body.data[0].clave).toBe('Material')
  })

  it('404 — consignación no encontrada', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue(null)

    const res = await PUT(makeAuthRequest('PUT', '/api/consignments/c1/specs', { specs: validSpecs }), params)
    expect(res.status).toBe(404)
  })

  it('422 — specs vacío', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({ id: 'c1' } as any)

    const res = await PUT(makeAuthRequest('PUT', '/api/consignments/c1/specs', { specs: [] }), params)
    expect(res.status).toBe(422)
  })

  it('422 — spec con valor vacío', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({ id: 'c1' } as any)

    const res = await PUT(makeAuthRequest('PUT', '/api/consignments/c1/specs', { specs: [{ clave: 'Material', valor: '' }] }), params)
    expect(res.status).toBe(422)
  })
})
