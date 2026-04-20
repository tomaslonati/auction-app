import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { AuctionCategory, AuctionStatus, AuctionCurrency } from '@prisma/client'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return null

  return prisma.user.findUnique({
    where: { id: user.id },
    select: { estado: true, categoria: true },
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') as AuctionStatus | null
    const categoria = searchParams.get('categoria') as AuctionCategory | null
    const moneda = searchParams.get('moneda') as AuctionCurrency | null
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const dbUser = await getAuthenticatedUser(request)
    const isAuthenticated = dbUser?.estado === 'aprobado'

    const auctions = await prisma.auction.findMany({
      where: {
        ...(estado ? { estado } : {}),
        ...(categoria ? { categoria } : {}),
        ...(moneda ? { moneda } : {}),
        ...(fechaDesde || fechaHasta ? {
          fechaInicio: {
            ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
            ...(fechaHasta ? { lte: new Date(fechaHasta) } : {}),
          },
        } : {}),
      },
      include: {
        rematador: true,
        specs: { select: { clave: true, valor: true } },
        items: {
          select: {
            id: true,
            numeroPieza: true,
            descripcion: true,
            estado: true,
            ...(isAuthenticated ? { precioBase: true } : {}),
          },
        },
        _count: { select: { items: true } },
      },
    })

    return NextResponse.json({ data: auctions, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
