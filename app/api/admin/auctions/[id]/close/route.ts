import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id: auctionId } = await params

    const auction = await prisma.auction.findUnique({ where: { id: auctionId } })
    if (!auction) {
      return NextResponse.json({ data: null, error: 'Auction not found' }, { status: 404 })
    }
    if (auction.estado !== 'activa') {
      return NextResponse.json({ data: null, error: 'Auction is not active' }, { status: 400 })
    }

    // Mark any remaining en_subasta items as sin_postor
    await prisma.item.updateMany({
      where: { subastaId: auctionId, estado: 'en_subasta' },
      data: { estado: 'sin_postor' },
    })

    const updated = await prisma.auction.update({
      where: { id: auctionId },
      data: { estado: 'finalizada', fechaFin: new Date() },
    })

    return NextResponse.json({ data: updated, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
