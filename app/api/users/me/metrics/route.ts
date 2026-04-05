import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { categoria: true },
    })

    const sessions = await prisma.auctionSession.findMany({
      where: { userId },
      distinct: ['auctionId'],
      include: { auction: { select: { categoria: true } } },
    })

    const purchases = await prisma.purchase.findMany({
      where: { compradorUserId: userId },
      select: { montoFinal: true, comision: true, costoEnvio: true, subastaId: true },
    })

    const bids = await prisma.bid.findMany({
      where: { userId },
      select: { monto: true, subastaId: true },
    })

    const totalSubastas = new Set(sessions.map((s) => s.auctionId)).size
    const itemsGanados = purchases.length
    const ratio = totalSubastas > 0 ? itemsGanados / totalSubastas : 0

    const totalOfertado = bids.reduce((acc, b) => acc + Number(b.monto), 0)
    const totalPagado = purchases.reduce((acc, p) => acc + Number(p.montoFinal) + Number(p.comision) + Number(p.costoEnvio), 0)

    const byCategory: Record<string, { subastas: number; ganados: number }> = {}
    for (const s of sessions) {
      const cat = s.auction.categoria
      if (!byCategory[cat]) byCategory[cat] = { subastas: 0, ganados: 0 }
      byCategory[cat].subastas++
    }
    for (const p of purchases) {
      const session = sessions.find((s) => s.auctionId === p.subastaId)
      if (session) {
        const cat = session.auction.categoria
        if (byCategory[cat]) byCategory[cat].ganados++
      }
    }

    return NextResponse.json({
      data: {
        categoria: user?.categoria,
        totalSubastas,
        itemsGanados,
        ratioExito: ratio,
        totalOfertado,
        totalPagado,
        desglosePorCategoria: byCategory,
      },
      error: null,
    })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
