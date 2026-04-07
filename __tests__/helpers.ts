import { NextRequest } from 'next/server'

export function makeRequest(
  method: string,
  url: string,
  body?: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function makeAuthRequest(method: string, url: string, body?: unknown): NextRequest {
  return makeRequest(method, url, body, { Authorization: 'Bearer mock-token' })
}
