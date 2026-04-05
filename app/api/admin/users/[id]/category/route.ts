import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendRegistrationApprovedEmail } from '@/lib/email'

const schema = z.object({
  categoria: z.enum(['comun', 'especial', 'plata', 'oro', 'platino']).optional(),
  estado: z.enum(['pendiente_verificacion', 'aprobado', 'multado', 'bloqueado', 'proceso_judicial']).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ data: null, error: 'User not found' }, { status: 404 })

    const wasNotApproved = user.estado !== 'aprobado' && user.categoria === null
    const isNowApproved = parsed.data.estado === 'aprobado' || (parsed.data.categoria && user.estado !== 'aprobado')

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.categoria ? { categoria: parsed.data.categoria } : {}),
        ...(parsed.data.estado ? { estado: parsed.data.estado } : {}),
      },
    })

    // Send approval email on first approval
    if (wasNotApproved && parsed.data.categoria && !user.registroCompletado) {
      try {
        await sendRegistrationApprovedEmail(user.email, user.nombre)
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({ data: updated, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
