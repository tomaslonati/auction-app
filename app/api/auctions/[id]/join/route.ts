import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessAuction } from '@/lib/category'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id: auctionId } = await params

    const [user, auction] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { estado: true, categoria: true },
      }),
      prisma.auction.findUnique({ where: { id: auctionId } }),
    ])

    if (!user) return NextResponse.json({ data: null, error: 'User not found' }, { status: 404 })
    if (!auction) return NextResponse.json({ data: null, error: 'Auction not found' }, { status: 404 })

    if (user.estado !== 'aprobado') {
      return NextResponse.json({ data: null, error: 'Account not approved' }, { status: 403 })
    }

    const pendingPenalty = await prisma.penalty.findFirst({
      where: { userId, estado: 'pendiente' },
    })
    if (pendingPenalty) {
      return NextResponse.json({ data: null, error: 'Cannot join: pending penalties exist' }, { status: 403 })
    }

    if (!canAccessAuction(user.categoria, auction.categoria)) {
      return NextResponse.json({ data: null, error: 'Insufficient category to access this auction' }, { status: 403 })
    }

    const existingSession = await prisma.auctionSession.findFirst({
      where: { userId, disconnectedAt: null },
    })
    if (existingSession) {
      return NextResponse.json({ data: null, error: 'Already in an active auction session' }, { status: 409 })
    }

    const session = await prisma.auctionSession.create({
      data: { userId, auctionId },
    })

    const currentItem = await prisma.item.findFirst({
      where: { subastaId: auctionId, estado: 'en_subasta' },
      include: { images: { take: 1 } },
    })

    const highestBid = currentItem
      ? await prisma.bid.findFirst({
          where: { itemId: currentItem.id, estado: 'confirmada' },
          orderBy: { monto: 'desc' },
        })
      : null

    return NextResponse.json({
      data: { session, currentItem, highestBid },
      error: null,
    }, { status: 201 })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
