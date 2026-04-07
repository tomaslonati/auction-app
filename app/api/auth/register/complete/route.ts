import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const schema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { userId, password } = parsed.data

    console.log('[complete] 1 - looking up user', userId)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    console.log('[complete] 2 - user found', user?.estado)
    if (!user) return NextResponse.json({ data: null, error: 'User not found' }, { status: 404 })

    if (user.estado !== 'aprobado') {
      return NextResponse.json({ data: null, error: 'Account not approved yet' }, { status: 403 })
    }
    if (user.registroCompletado) {
      return NextResponse.json({ data: null, error: 'Registration already completed' }, { status: 400 })
    }

    console.log('[complete] 3 - updating password in supabase')
    await supabaseAdmin.auth.admin.updateUserById(userId, { password })
    console.log('[complete] 4 - updating prisma')

    await prisma.user.update({
      where: { id: userId },
      data: { registroCompletado: true },
    })
    console.log('[complete] 5 - done')

    return NextResponse.json({ data: { message: 'Password set. Registration complete.' }, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
