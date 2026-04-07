import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Routes that do NOT require authentication
const PUBLIC_ROUTES: { method: string; path: string }[] = [
  { method: 'GET', path: '/api/auctions' },
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/register/step1' },
  { method: 'GET', path: '/api/swagger' },
  { method: 'POST', path: '/api/auth/password/forgot' },
  { method: 'POST', path: '/api/auth/register/complete' },
]

function isPublicRoute(method: string, pathname: string): boolean {
  return PUBLIC_ROUTES.some((r) => {
    if (r.method !== method) return false
    // Exact match or query-string variant
    if (pathname === r.path) return true
    // Allow GET /api/auctions/... to remain auth-optional at catalog level
    if (r.path === '/api/auctions' && method === 'GET' && pathname.startsWith('/api/auctions')) return true
    return false
  })
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (isPublicRoute(request.method, pathname)) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)

  // Verify JWT with Supabase (no DB call — Edge-compatible)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return NextResponse.json({ data: null, error: 'Invalid or expired token' }, { status: 401 })
  }

  // Note: proceso_judicial check is done per-route via requireAuth + DB query
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
