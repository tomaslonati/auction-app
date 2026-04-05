import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id: auctionId } = await params

    const session = await prisma.auctionSession.findFirst({
      where: { userId, auctionId, disconnectedAt: null },
    })

    if (!session) {
      return NextResponse.json({ data: null, error: 'No active session in this auction' }, { status: 404 })
    }

    const updated = await prisma.auctionSession.update({
      where: { id: session.id },
      data: { disconnectedAt: new Date() },
    })

    return NextResponse.json({ data: updated, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
