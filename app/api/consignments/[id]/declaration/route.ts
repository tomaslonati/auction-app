import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  declaraTitularidad: z.literal(true),
  aceptaDevolucionConCargo: z.literal(true),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id } = await params

    const consignment = await prisma.consignment.findFirst({ where: { id, userId } })
    if (!consignment) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    const photoCount = await prisma.consignmentPhoto.count({ where: { consignmentId: id } })
    if (photoCount < 6) {
      return NextResponse.json({ data: null, error: `At least 6 photos required (current: ${photoCount})` }, { status: 422 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: 'You must declare ownership and accept return conditions' }, { status: 422 })
    }

    const updated = await prisma.consignment.update({
      where: { id },
      data: { declaraTitularidad: true, aceptaDevolucionConCargo: true, estado: 'en_evaluacion' },
    })

    return NextResponse.json({ data: updated, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
