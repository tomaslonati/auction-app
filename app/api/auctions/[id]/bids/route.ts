import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  itemId: z.string().uuid(),
  paymentMethodId: z.string().uuid(),
  monto: z.number().positive(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id: auctionId } = await params

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { itemId, paymentMethodId, monto } = parsed.data

    // 1. Active session check
    const session = await prisma.auctionSession.findFirst({
      where: { userId, auctionId, disconnectedAt: null },
    })
    if (!session) {
      return NextResponse.json({ data: null, error: 'No active session in this auction' }, { status: 403 })
    }

    // 2. Has verified payment method
    const verifiedMethod = await prisma.paymentMethod.findFirst({
      where: { userId, estado: 'verificado' },
    })
    if (!verifiedMethod) {
      return NextResponse.json({ data: null, error: 'No verified payment method' }, { status: 403 })
    }

    // 3. Payment method belongs to user and is verified
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { id: paymentMethodId, userId, estado: 'verificado' },
      include: { certifiedCheck: true },
    })
    if (!paymentMethod) {
      return NextResponse.json({ data: null, error: 'Payment method not found or not verified' }, { status: 400 })
    }

    // 4. Dollar auction restriction
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } })
    if (!auction) return NextResponse.json({ data: null, error: 'Auction not found' }, { status: 404 })

    if (auction.moneda === 'dolares') {
      const allowed = paymentMethod.esInternacional &&
        (paymentMethod.tipo === 'cuenta_bancaria' || paymentMethod.tipo === 'tarjeta_credito')
      if (!allowed) {
        return NextResponse.json(
          { data: null, error: 'Dollar auctions require an international bank account or credit card' },
          { status: 400 }
        )
      }
    }

    // 5. No pending bid for this item
    const pendingBid = await prisma.bid.findFirst({
      where: { userId, itemId, estado: 'enviada' },
    })
    if (pendingBid) {
      return NextResponse.json({ data: null, error: 'You already have a pending bid for this item' }, { status: 409 })
    }

    // 6. Calculate last offer
    const item = await prisma.item.findUnique({ where: { id: itemId } })
    if (!item || item.subastaId !== auctionId) {
      return NextResponse.json({ data: null, error: 'Item not found in this auction' }, { status: 404 })
    }

    const lastConfirmedBid = await prisma.bid.findFirst({
      where: { itemId, estado: 'confirmada' },
      orderBy: { monto: 'desc' },
    })

    const ultimaOferta = lastConfirmedBid ? Number(lastConfirmedBid.monto) : Number(item.precioBase)
    const precioBase = Number(item.precioBase)

    // 7. Validate range
    const minBid = ultimaOferta + precioBase * 0.01
    const maxBid = ultimaOferta + precioBase * 0.20
    const noMaxLimit = auction.categoria === 'oro' || auction.categoria === 'platino'

    if (monto < minBid) {
      return NextResponse.json({ data: null, error: `Bid must be at least ${minBid}` }, { status: 422 })
    }
    if (!noMaxLimit && monto > maxBid) {
      return NextResponse.json({ data: null, error: `Bid cannot exceed ${maxBid}` }, { status: 422 })
    }

    // 8. Certified check balance
    if (paymentMethod.tipo === 'cheque_certificado' && paymentMethod.certifiedCheck) {
      if (Number(paymentMethod.certifiedCheck.montoDisponible) < monto) {
        return NextResponse.json({ data: null, error: 'Insufficient balance in certified check' }, { status: 400 })
      }
    }

    const bid = await prisma.bid.create({
      data: { subastaId: auctionId, itemId, userId, paymentMethodId, monto },
    })

    return NextResponse.json({ data: bid, error: null }, { status: 201 })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
