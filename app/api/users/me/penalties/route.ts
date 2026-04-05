import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)

    const penalties = await prisma.penalty.findMany({
      where: { userId },
      include: { purchase: { select: { id: true, montoFinal: true } } },
      orderBy: { fechaLimite: 'asc' },
    })

    return NextResponse.json({ data: penalties, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
