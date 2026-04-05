import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    await requireAuth(request)
    const { itemId } = await params

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        images: { orderBy: { orden: 'asc' } },
        components: { orderBy: { orden: 'asc' } },
        previousOwners: { orderBy: { orden: 'asc' } },
        duenUser: { select: { nombre: true, apellido: true } },
      },
    })

    if (!item) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: item, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
