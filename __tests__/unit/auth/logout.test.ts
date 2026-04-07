import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/logout/route'
import { makeAuthRequest } from '../../helpers'

describe('POST /api/auth/logout', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — cierra sesión', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/auth/logout'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.message).toBe('Logged out')
  })
})
