import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/password/forgot/route'
import { makeRequest } from '../../helpers'

describe('POST /api/auth/password/forgot', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — responde igual sin importar si el email existe', async () => {
    const res = await POST(makeRequest('POST', '/api/auth/password/forgot', { email: 'test@test.com' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.message).toContain('reset link')
  })

  it('422 — email inválido', async () => {
    const res = await POST(makeRequest('POST', '/api/auth/password/forgot', { email: 'no-email' }))
    expect(res.status).toBe(422)
  })
})
