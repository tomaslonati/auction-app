import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id } = await params

    const penalty = await prisma.penalty.findFirst({ where: { id, userId } })
    if (!penalty) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
    if (penalty.estado !== 'pendiente') {
      return NextResponse.json({ data: null, error: 'Penalty is not pending' }, { status: 400 })
    }

    const updated = await prisma.penalty.update({
      where: { id },
      data: { estado: 'pagada', pagadaEn: new Date() },
    })

    return NextResponse.json({ data: updated, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
