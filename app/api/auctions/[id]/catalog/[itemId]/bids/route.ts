import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    await requireAuth(request)
    const { itemId } = await params

    const bids = await prisma.bid.findMany({
      where: { itemId },
      include: {
        user: { select: { nombre: true, apellido: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ data: bids, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
