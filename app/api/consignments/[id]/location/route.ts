import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id } = await params

    const consignment = await prisma.consignment.findFirst({
      where: { id, userId },
      include: { location: { include: { deposit: true } } },
    })

    if (!consignment) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
    if (!consignment.location) return NextResponse.json({ data: null, error: 'Item not yet in deposit' }, { status: 404 })

    return NextResponse.json({
      data: {
        deposit: consignment.location.deposit,
        sector: consignment.location.sector,
        fechaIngreso: consignment.location.fechaIngreso,
      },
      error: null,
    })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
