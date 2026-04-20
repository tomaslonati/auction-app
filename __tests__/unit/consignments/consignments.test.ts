import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/consignments/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const validBody = { descripcion: 'Reloj antiguo', esCompuesto: false, esObraArte: false }

describe('GET /api/consignments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna consignaciones del usuario', async () => {
    vi.mocked(prisma.consignment.findMany).mockResolvedValue([
      { id: 'c1', descripcion: 'Reloj', estado: 'en_evaluacion', photos: [], specs: [], inspection: null },
    ] as any)

    const res = await GET(makeAuthRequest('GET', '/api/consignments'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
  })
})

describe('POST /api/consignments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('201 — crea consignación', async () => {
    vi.mocked(prisma.consignment.create).mockResolvedValue({ id: 'c1', ...validBody, estado: 'en_evaluacion', specs: [] } as any)

    const res = await POST(makeAuthRequest('POST', '/api/consignments', validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.id).toBe('c1')
  })

  it('201 — crea consignación con specs', async () => {
    const bodyConSpecs = { ...validBody, specs: [{ clave: 'Material', valor: 'Plata' }, { clave: 'Peso', valor: '200g' }] }
    vi.mocked(prisma.consignment.create).mockResolvedValue({ id: 'c2', ...validBody, estado: 'en_evaluacion', specs: bodyConSpecs.specs } as any)

    const res = await POST(makeAuthRequest('POST', '/api/consignments', bodyConSpecs))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.specs).toHaveLength(2)
  })

  it('422 — descripción vacía', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/consignments', { descripcion: '' }))
    expect(res.status).toBe(422)
  })

  it('422 — spec con clave vacía', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/consignments', { ...validBody, specs: [{ clave: '', valor: 'algo' }] }))
    expect(res.status).toBe(422)
  })
})
