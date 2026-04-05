import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id } = await params

    const purchase = await prisma.purchase.findFirst({
      where: { id, compradorUserId: userId },
    })

    if (!purchase) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    if (purchase.estadoPago !== 'pagado') {
      return NextResponse.json({ data: null, error: 'Purchase must be paid before declaring pickup' }, { status: 422 })
    }

    if (purchase.retiroPersonal) {
      return NextResponse.json({ data: null, error: 'Pickup already declared' }, { status: 400 })
    }

    const updated = await prisma.purchase.update({
      where: { id },
      data: { retiroPersonal: true },
    })

    return NextResponse.json({ data: { ...updated, warning: 'Insurance coverage has been voided for this item.' }, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
