import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/password/reset/route'
import { makeAuthRequest } from '../../helpers'

describe('POST /api/auth/password/reset', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — actualiza la contraseña', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/auth/password/reset', { password: 'newpassword123' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.message).toContain('Password updated')
  })

  it('422 — contraseña muy corta', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/auth/password/reset', { password: '123' }))
    expect(res.status).toBe(422)
  })
})
