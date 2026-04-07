import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auctions/[id]/leave/route'
import { prisma } from '@/lib/prisma'
import { makeAuthRequest } from '../../helpers'

const params = { params: Promise.resolve({ id: 'a1' }) }

describe('POST /api/auctions/[id]/leave', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — abandona la sesión', async () => {
    vi.mocked(prisma.auctionSession.findFirst).mockResolvedValue({ id: 's1' } as any)
    vi.mocked(prisma.auctionSession.update).mockResolvedValue({ id: 's1', disconnectedAt: new Date() } as any)

    const res = await POST(makeAuthRequest('POST', '/api/auctions/a1/leave'), params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.disconnectedAt).toBeDefined()
  })

  it('404 — sin sesión activa', async () => {
    vi.mocked(prisma.auctionSession.findFirst).mockResolvedValue(null)

    const res = await POST(makeAuthRequest('POST', '/api/auctions/a1/leave'), params)
    expect(res.status).toBe(404)
  })
})
