import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/storage/upload-url/route'
import { makeAuthRequest } from '../../helpers'

describe('POST /api/storage/upload-url', () => {
  beforeEach(() => vi.clearAllMocks())

  it('200 — retorna URL firmada', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/storage/upload-url', {
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
      folder: 'consignments',
    }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.uploadUrl).toBe('https://signed.url')
    expect(body.data.token).toBe('tok')
    expect(body.data.publicUrl).toBeDefined()
    expect(body.data.path).toMatch(/^consignments\//)
  })

  it('200 — folder por defecto es consignments', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/storage/upload-url', {
      filename: 'doc.png',
      contentType: 'image/png',
    }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.path).toMatch(/^consignments\//)
  })

  it('422 — contentType no permitido', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/storage/upload-url', {
      filename: 'file.pdf',
      contentType: 'application/pdf',
    }))
    expect(res.status).toBe(422)
  })

  it('422 — filename vacío', async () => {
    const res = await POST(makeAuthRequest('POST', '/api/storage/upload-url', {
      filename: '',
      contentType: 'image/jpeg',
    }))
    expect(res.status).toBe(422)
  })
})
