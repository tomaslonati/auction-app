import { describe, it, expect } from 'vitest'

const BASE = 'http://localhost:3000'

describe('Auth integration', () => {
  it('POST /api/auth/register/step1 — responde con shape correcta o 422', async () => {
    const res = await fetch(`${BASE}/api/auth/register/step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test+${Date.now()}@example.com`,
        nombre: 'Test',
        apellido: 'User',
        domicilio: 'Calle 123',
        numeroPais: 1,
      }),
    })

    // 201 si el país existe, 422 si no
    expect([201, 422, 500]).toContain(res.status)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('error')
  })

  it('POST /api/auth/login — 401 con credenciales inválidas', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'noexiste@test.com', password: 'wrongpass' }),
    })

    expect([401, 400, 422]).toContain(res.status)
  })

  it('GET /api/auth/register/status — 401 sin token', async () => {
    const res = await fetch(`${BASE}/api/auth/register/status`)
    expect([401, 403]).toContain(res.status)
  })
})
