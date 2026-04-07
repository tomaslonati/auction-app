import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  comision: z.number().min(0).default(0),
  costoEnvio: z.number().min(0).default(0),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await requireAdmin(request)
    const { id: auctionId, itemId } = await params

    const auction = await prisma.auction.findUnique({ where: { id: auctionId } })
    if (!auction || auction.estado !== 'activa') {
      return NextResponse.json({ data: null, error: 'Auction is not active' }, { status: 400 })
    }

    const item = await prisma.item.findFirst({
      where: { id: itemId, subastaId: auctionId, estado: 'en_subasta' },
    })
    if (!item) {
      return NextResponse.json({ data: null, error: 'Item not found or not in auction' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { comision, costoEnvio } = parsed.data

    const topBid = await prisma.bid.findFirst({
      where: { itemId, estado: 'confirmada' },
      orderBy: { monto: 'desc' },
    })

    let purchase: Awaited<ReturnType<typeof prisma.purchase.create>> | null = null

    if (topBid) {
      // Mark all other confirmed bids as superada
      await prisma.bid.updateMany({
        where: { itemId, estado: 'confirmada', id: { not: topBid.id } },
        data: { estado: 'superada' },
      })

      // Discount certified check if applicable
      const pm = await prisma.paymentMethod.findUnique({
        where: { id: topBid.paymentMethodId },
        include: { certifiedCheck: true },
      })
      if (pm?.certifiedCheck) {
        await prisma.certifiedCheck.update({
          where: { id: pm.certifiedCheck.id },
          data: { montoDisponible: { decrement: topBid.monto } },
        })
      }

      // Create purchase
      purchase = await prisma.purchase.create({
        data: {
          itemId,
          subastaId: auctionId,
          compradorUserId: topBid.userId,
          bidId: topBid.id,
          paymentMethodId: topBid.paymentMethodId,
          montoFinal: topBid.monto,
          comision,
          costoEnvio,
        },
      })

      // Update item
      await prisma.item.update({
        where: { id: itemId },
        data: { estado: 'vendido', duenUserId: topBid.userId },
      })

      // Notify winner
      await prisma.notification.create({
        data: {
          userId: topBid.userId,
          tipo: 'adjudicacion',
          titulo: `¡Ganaste la pieza ${item.numeroPieza}!`,
          cuerpo: `Tu oferta de ${topBid.monto} fue adjudicada. Comisión: ${comision}. Costo de envío: ${costoEnvio}.`,
          metadata: { purchaseId: purchase.id },
        },
      })

      // Notify losers
      const loserBids = await prisma.bid.findMany({
        where: { itemId, userId: { not: topBid.userId } },
        distinct: ['userId'],
        select: { userId: true },
      })
      if (loserBids.length > 0) {
        await prisma.notification.createMany({
          data: loserBids.map((b) => ({
            userId: b.userId,
            tipo: 'adjudicacion',
            titulo: `Pieza ${item.numeroPieza} adjudicada`,
            cuerpo: 'El ítem fue adjudicado a otro postor.',
            metadata: { itemId },
          })),
        })
      }
    } else {
      // No bids — just mark the item, no Purchase record
      await prisma.item.update({ where: { id: itemId }, data: { estado: 'sin_postor' } })
    }

    // Advance next item to en_subasta
    const nextItem = await prisma.item.findFirst({
      where: { subastaId: auctionId, estado: 'pendiente' },
      orderBy: { createdAt: 'asc' },
    })
    if (nextItem) {
      await prisma.item.update({ where: { id: nextItem.id }, data: { estado: 'en_subasta' } })
    }

    return NextResponse.json({ data: { purchase, nextItem }, error: null }, { status: 201 })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
