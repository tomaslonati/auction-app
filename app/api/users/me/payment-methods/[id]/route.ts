import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id } = await params

    const method = await prisma.paymentMethod.findFirst({
      where: { id, userId },
      include: { bankAccount: true, creditCard: true, certifiedCheck: true },
    })

    if (!method) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: method, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id } = await params

    const method = await prisma.paymentMethod.findFirst({ where: { id, userId } })
    if (!method) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    const activeSession = await prisma.auctionSession.findFirst({
      where: { userId, disconnectedAt: null },
    })
    if (activeSession) {
      return NextResponse.json({ data: null, error: 'Cannot delete while in an active auction session' }, { status: 400 })
    }

    const pendingPurchase = await prisma.purchase.findFirst({
      where: { paymentMethodId: id, estadoPago: 'pendiente' },
    })
    if (pendingPurchase) {
      return NextResponse.json({ data: null, error: 'Cannot delete payment method with pending purchases' }, { status: 400 })
    }

    await prisma.paymentMethod.delete({ where: { id } })

    return NextResponse.json({ data: { message: 'Deleted' }, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
