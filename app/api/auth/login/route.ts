import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BLOCKED_STATES: Record<string, string> = {
  bloqueado: 'Tu cuenta está bloqueada. Contactá con la empresa para más información.',
  multado: 'Tu cuenta tiene multas pendientes. Regularizá tu situación antes de ingresar.',
  proceso_judicial: 'Tu cuenta está suspendida por un proceso judicial.',
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { email, password } = parsed.data
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 401 })
    }

    // Verificar estado del usuario en la DB
    const dbUser = await prisma.user.findUnique({
      where: { id: data.user!.id },
      select: { estado: true },
    })

    if (dbUser && BLOCKED_STATES[dbUser.estado]) {
      // Revocar la sesión recién creada para no dejar tokens flotando
      await supabase.auth.signOut()
      return NextResponse.json({ data: null, error: BLOCKED_STATES[dbUser.estado] }, { status: 403 })
    }

    return NextResponse.json({ data: { accessToken: data.session?.access_token, user: data.user }, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
