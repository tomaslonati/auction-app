import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  estado: z.enum(['verificado', 'rechazado']),
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

    const method = await prisma.paymentMethod.findUnique({ where: { id } })
    if (!method) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    const updated = await prisma.paymentMethod.update({
      where: { id },
      data: { estado: parsed.data.estado },
    })

    // If verified, check if user registration should be completed
    if (parsed.data.estado === 'verificado') {
      const user = await prisma.user.findUnique({
        where: { id: method.userId },
        select: { registroCompletado: true, passwordHash: true },
      })
      if (user && !user.registroCompletado) {
        await prisma.user.update({
          where: { id: method.userId },
          data: { registroCompletado: true },
        })
      }
    }

    return NextResponse.json({ data: updated, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
