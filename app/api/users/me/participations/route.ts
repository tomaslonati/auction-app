import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const { searchParams } = new URL(request.url)

    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const categoria = searchParams.get('categoria')
    const resultado = searchParams.get('resultado') // 'gano' | 'perdio' | 'participo'

    const sessions = await prisma.auctionSession.findMany({
      where: {
        userId,
        auction: {
          ...(categoria ? { categoria: categoria as never } : {}),
          ...(fechaDesde || fechaHasta ? {
            fechaInicio: {
              ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
              ...(fechaHasta ? { lte: new Date(fechaHasta) } : {}),
            },
          } : {}),
        },
      },
      include: {
        auction: {
          select: { id: true, nombre: true, fechaInicio: true, categoria: true, moneda: true },
        },
      },
      distinct: ['auctionId'],
    })

    const auctionIds = sessions.map((s) => s.auctionId)

    const bids = await prisma.bid.findMany({
      where: { userId, subastaId: { in: auctionIds } },
      include: { item: { select: { id: true } } },
    })

    const wonPurchases = await prisma.purchase.findMany({
      where: { compradorUserId: userId, subastaId: { in: auctionIds } },
      select: { subastaId: true, montoFinal: true, comision: true },
    })

    const summary = sessions.map((s) => {
      const auctionBids = bids.filter((b) => b.subastaId === s.auctionId)
      const won = wonPurchases.filter((p) => p.subastaId === s.auctionId)
      return {
        auction: s.auction,
        bidCount: auctionBids.length,
        itemsWon: won.length,
        totalPaid: won.reduce((acc, p) => acc + Number(p.montoFinal) + Number(p.comision), 0),
      }
    })

    const filtered = resultado
      ? summary.filter((s) => {
          if (resultado === 'gano') return s.itemsWon > 0
          if (resultado === 'perdio') return s.bidCount > 0 && s.itemsWon === 0
          return true
        })
      : summary

    const totals = {
      totalSubastas: filtered.length,
      itemsGanados: filtered.reduce((acc, s) => acc + s.itemsWon, 0),
      importeTotalPagado: filtered.reduce((acc, s) => acc + s.totalPaid, 0),
    }

    return NextResponse.json({ data: { participations: filtered, totals }, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
