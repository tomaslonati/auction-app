import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  email: z.string().email(),
})

// Possible statuses:
// not_found      → no account, redirect to registration
// pending        → registered, waiting for approval
// needs_password → approved, password not yet set
// ready          → has password, show password field
export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ data: null, error: 'Email inválido' }, { status: 422 })
  }

  const { email } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return NextResponse.json({ data: { status: 'not_found' }, error: null })
  }

  if (!user.registroCompletado) {
    // Approved but no password yet
    if (user.estado === 'aprobado') {
      return NextResponse.json({
        data: { status: 'needs_password', userId: user.id },
        error: null,
      })
    }
    // Any other state = still pending review (pendiente_verificacion, rechazado, etc.)
    return NextResponse.json({ data: { status: 'pending', estado: user.estado }, error: null })
  }

  return NextResponse.json({ data: { status: 'ready' }, error: null })
}
