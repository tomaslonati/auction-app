import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/consignments/[id]/photos/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'c1' }) }
const validBody = { photos: [{ url: 'https://example.com/foto1.jpg', orden: 0 }] }

describe('POST /api/consignments/[id]/photos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('201 — agrega fotos', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({ id: 'c1' } as any)
    vi.mocked(prisma.consignmentPhoto.createMany).mockResolvedValue({ count: 1 } as any)
    vi.mocked(prisma.consignmentPhoto.count).mockResolvedValue(1)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/photos', validBody), params)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.created).toBe(1)
    expect(body.data.totalPhotos).toBe(1)
  })

  it('404 — consignación no encontrada', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/photos', validBody), params)
    expect(res.status).toBe(404)
  })

  it('422 — array de fotos vacío', async () => {
    vi.mocked(prisma.consignment.findFirst).mockResolvedValue({ id: 'c1' } as any)

    const res = await POST(makeAuthRequest('POST', '/api/consignments/c1/photos', { photos: [] }), params)
    expect(res.status).toBe(422)
  })
})
