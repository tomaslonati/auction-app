import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const schema = z.object({ password: z.string().min(8) })

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    await supabaseAdmin.auth.admin.updateUserById(userId, { password: parsed.data.password })

    return NextResponse.json({ data: { message: 'Password updated successfully' }, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
