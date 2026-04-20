import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)

    // All user bids in active auctions, grouped by auction + item
    const userBids = await prisma.bid.findMany({
      where: {
        userId,
        subasta: { estado: 'activa' },
      },
      include: {
        subasta: { select: { id: true, nombre: true, categoria: true, moneda: true, estado: true } },
        item: { select: { id: true, descripcion: true, numeroPieza: true, precioBase: true } },
      },
      orderBy: { monto: 'desc' },
    })

    if (userBids.length === 0) {
      return NextResponse.json({ data: [], error: null })
    }

    // Unique item IDs across all active auctions
    const itemIds = [...new Set(userBids.map((b) => b.itemId))]

    // Current top confirmed bid per item (to know who is winning)
    const topBids = await prisma.bid.findMany({
      where: {
        itemId: { in: itemIds },
        estado: 'confirmada',
      },
      orderBy: { monto: 'desc' },
      distinct: ['itemId'],
    })

    const topBidByItem = new Map(topBids.map((b) => [b.itemId, b]))

    // Group user bids by auction, then by item — keep only best bid per item
    const byAuction = new Map<string, {
      auction: (typeof userBids)[0]['subasta']
      items: Map<string, {
        item: (typeof userBids)[0]['item']
        miMejorPuja: { id: string; monto: number; estado: string; createdAt: Date }
        mejorPujaActual: number | null
        situacion: 'ganando' | 'superada' | 'pendiente'
      }>
    }>()

    for (const bid of userBids) {
      const auctionId = bid.subastaId

      if (!byAuction.has(auctionId)) {
        byAuction.set(auctionId, { auction: bid.subasta, items: new Map() })
      }

      const auctionEntry = byAuction.get(auctionId)!

      // Already have a higher bid for this item from the user — skip
      if (auctionEntry.items.has(bid.itemId)) continue

      const topBid = topBidByItem.get(bid.itemId)
      const topMonto = topBid ? Number(topBid.monto) : null
      const miMonto = Number(bid.monto)

      let situacion: 'ganando' | 'superada' | 'pendiente'

      if (bid.estado === 'superada') {
        situacion = 'superada'
      } else if (bid.estado === 'confirmada' && topBid?.userId === userId) {
        situacion = 'ganando'
      } else if (bid.estado === 'enviada') {
        situacion = 'pendiente'
      } else {
        // confirmada but someone else has a higher confirmed bid
        situacion = topMonto !== null && miMonto < topMonto ? 'superada' : 'ganando'
      }

      auctionEntry.items.set(bid.itemId, {
        item: bid.item,
        miMejorPuja: {
          id: bid.id,
          monto: miMonto,
          estado: bid.estado,
          createdAt: bid.createdAt,
        },
        mejorPujaActual: topMonto,
        situacion,
      })
    }

    const data = Array.from(byAuction.values()).map(({ auction, items }) => ({
      auction,
      items: Array.from(items.values()),
    }))

    return NextResponse.json({ data, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
