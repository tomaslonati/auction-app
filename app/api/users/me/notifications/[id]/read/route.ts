import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id } = await params

    const notification = await prisma.notification.findFirst({ where: { id, userId } })
    if (!notification) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    const updated = await prisma.notification.update({
      where: { id },
      data: { leida: true, leidaEn: new Date() },
    })

    return NextResponse.json({ data: updated, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
