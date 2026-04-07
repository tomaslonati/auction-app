import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/login/route'
import { makeRequest } from '../../helpers'

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna accessToken', async () => {
    const res = await POST(makeRequest('POST', '/api/auth/login', { email: 'test@test.com', password: 'password' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.accessToken).toBe('mock-token')
  })

  it('422 — email inválido', async () => {
    const res = await POST(makeRequest('POST', '/api/auth/login', { email: 'no-email', password: 'pass' }))
    expect(res.status).toBe(422)
  })

  it('422 — password vacía', async () => {
    const res = await POST(makeRequest('POST', '/api/auth/login', { email: 'test@test.com', password: '' }))
    expect(res.status).toBe(422)
  })
})
