import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ auctionId: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { auctionId } = await params

    const bids = await prisma.bid.findMany({
      where: { userId, subastaId: auctionId },
      include: {
        item: { select: { id: true, descripcion: true, numeroPieza: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const purchases = await prisma.purchase.findMany({
      where: { compradorUserId: userId, subastaId: auctionId },
      select: { itemId: true, montoFinal: true, comision: true, costoEnvio: true, estadoPago: true },
    })

    const purchaseMap = new Map(purchases.map((p) => [p.itemId, p]))

    const itemMap = new Map<string, { item: typeof bids[0]['item']; bids: typeof bids; won: boolean; purchase: typeof purchases[0] | undefined }>()

    for (const bid of bids) {
      const existing = itemMap.get(bid.itemId)
      if (!existing) {
        itemMap.set(bid.itemId, { item: bid.item, bids: [bid], won: purchaseMap.has(bid.itemId), purchase: purchaseMap.get(bid.itemId) })
      } else {
        existing.bids.push(bid)
      }
    }

    return NextResponse.json({ data: Array.from(itemMap.values()), error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
