import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PUT } from '@/app/api/users/me/password/route'
import { makeAuthRequest } from '../../helpers'

describe('PUT /api/users/me/password', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — actualiza contraseña', async () => {
    const res = await PUT(makeAuthRequest('PUT', '/api/users/me/password', { newPassword: 'newpassword123' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.message).toBe('Password updated')
  })

  it('422 — contraseña muy corta', async () => {
    const res = await PUT(makeAuthRequest('PUT', '/api/users/me/password', { newPassword: '123' }))
    expect(res.status).toBe(422)
  })
})
