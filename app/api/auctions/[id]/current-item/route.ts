import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(request)
    const { id: auctionId } = await params

    const item = await prisma.item.findFirst({
      where: { subastaId: auctionId, estado: 'en_subasta' },
      include: {
        images: { orderBy: { orden: 'asc' } },
        components: true,
      },
    })

    if (!item) return NextResponse.json({ data: null, error: 'No item currently in auction' }, { status: 404 })

    const highestBid = await prisma.bid.findFirst({
      where: { itemId: item.id, estado: 'confirmada' },
      orderBy: { monto: 'desc' },
      include: { user: { select: { nombre: true, apellido: true } } },
    })

    return NextResponse.json({ data: { item, highestBid, precioBase: item.precioBase }, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
