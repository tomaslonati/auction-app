import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function requireAuth(request: NextRequest): Promise<{ userId: string }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw Object.assign(new Error('Missing or invalid authorization header'), { status: 401 })
  }

  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    throw Object.assign(new Error('Invalid or expired token'), { status: 401 })
  }

  // Block users in judicial process at route level
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { estado: true },
  })
  if (dbUser?.estado === 'proceso_judicial') {
    throw Object.assign(new Error('Account suspended due to judicial process'), { status: 403 })
  }

  return { userId: user.id }
}

export async function requireAdmin(request: NextRequest): Promise<{ userId: string }> {
  const { userId } = await requireAuth(request)

  const authHeader = request.headers.get('authorization')!
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 })
  }

  const isAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin'
  if (!isAdmin) {
    throw Object.assign(new Error('Forbidden: admin access required'), { status: 403 })
  }

  return { userId }
}
