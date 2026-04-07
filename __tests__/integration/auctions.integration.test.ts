import { describe, it, expect } from 'vitest'

const BASE = 'http://localhost:3000'

describe('Auctions integration', () => {
  it('GET /api/auctions — 401 sin token', async () => {
    const res = await fetch(`${BASE}/api/auctions`)
    expect([401, 403]).toContain(res.status)
  })

  it('GET /api/auctions — shape correcta con token válido', async () => {
    // Skip if no token configured
    const token = process.env.TEST_AUTH_TOKEN
    if (!token) return

    const res = await fetch(`${BASE}/api/auctions`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('GET /api/auctions/nonexistent — 404 o 401', async () => {
    const res = await fetch(`${BASE}/api/auctions/00000000-0000-0000-0000-000000000000`)
    expect([401, 403, 404]).toContain(res.status)
  })
})
