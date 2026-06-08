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

    // REGLA 2: El usuario no debe tener multas pendientes
    const pendingPenalty = await prisma.penalty.findFirst({
      where: { userId, estado: 'pendiente' },
    })
    if (pendingPenalty) {
      return NextResponse.json({ data: null, error: 'No podés pujar con multas pendientes de pago' }, { status: 403 })
    }

    // REGLA 3: El usuario debe tener al menos un medio de pago verificado
    const verifiedMethod = await prisma.paymentMethod.findFirst({
      where: { userId, estado: 'verificado' },
    })
    if (!verifiedMethod) {
      return NextResponse.json({ data: null, error: 'No tenés ningún medio de pago verificado' }, { status: 403 })
    }

    // REGLA 4: El medio de pago seleccionado debe pertenecer al usuario y estar verificado
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { id: paymentMethodId, userId, estado: 'verificado' },
      include: { certifiedCheck: true },
    })
    if (!paymentMethod) {
      return NextResponse.json({ data: null, error: 'El medio de pago no existe o no está verificado' }, { status: 400 })
    }

    const auction = await prisma.auction.findUnique({ where: { id: auctionId } })
    if (!auction) return NextResponse.json({ data: null, error: 'Subasta no encontrada' }, { status: 404 })

    // REGLA 5: La categoría del usuario debe ser suficiente para acceder a la subasta
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { categoria: true } })
    const { canAccessAuction } = await import('@/lib/category')
    if (!user || !canAccessAuction(user.categoria, auction.categoria)) {
      return NextResponse.json({ data: null, error: 'Tu categoría no es suficiente para participar en esta subasta' }, { status: 403 })
    }

    // REGLA 6 (subastas en dólares): Solo se aceptan tarjetas o cuentas bancarias internacionales
    if (auction.moneda === 'dolares') {
      const allowed = paymentMethod.esInternacional &&
        (paymentMethod.tipo === 'cuenta_bancaria' || paymentMethod.tipo === 'tarjeta_credito')
      if (!allowed) {
        return NextResponse.json(
          { data: null, error: 'Las subastas en dólares requieren una cuenta bancaria o tarjeta internacional' },
          { status: 400 }
        )
      }
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } })
    if (!item || item.subastaId !== auctionId) {
      return NextResponse.json({ data: null, error: 'Ítem no encontrado en esta subasta' }, { status: 404 })
    }
    if (item.estado !== 'en_subasta') {
      return NextResponse.json({ data: null, error: 'Este ítem no está en subasta actualmente' }, { status: 422 })
    }

    const lastConfirmedBid = await prisma.bid.findFirst({
      where: { itemId, estado: 'confirmada' },
      orderBy: { monto: 'desc' },
    })

    const ultimaOferta = lastConfirmedBid ? Number(lastConfirmedBid.monto) : Number(item.precioBase)
    const precioBase = Number(item.precioBase)

    // REGLA 8 (precio mínimo): La puja debe superar la última oferta en al menos 1% del precio base
    const minBid = ultimaOferta + precioBase * 0.01
    if (monto < minBid) {
      return NextResponse.json({ data: null, error: `La puja mínima es ${minBid.toFixed(2)}` }, { status: 422 })
    }

    // REGLA 9 (precio máximo): La puja no puede superar la última oferta en más del 20% del precio base
    // Excepción: subastas categoría "oro" y "platino" no tienen límite máximo
    const noMaxLimit = auction.categoria === 'oro' || auction.categoria === 'platino'
    const maxBid = ultimaOferta + precioBase * 0.20
    if (!noMaxLimit && monto > maxBid) {
      return NextResponse.json({ data: null, error: `La puja máxima es ${maxBid.toFixed(2)} (sin límite para subastas Oro y Platino)` }, { status: 422 })
    }

    // REGLA 10 (cheque certificado): El saldo disponible debe cubrir el monto ofertado
    if (paymentMethod.tipo === 'cheque_certificado' && paymentMethod.certifiedCheck) {
      if (Number(paymentMethod.certifiedCheck.montoDisponible) < monto) {
        return NextResponse.json({ data: null, error: 'Saldo insuficiente en el cheque certificado' }, { status: 400 })
      }
    }

    const bid = await prisma.$transaction(async (tx) => {
      // Marcar todas las pujas confirmadas anteriores del ítem como superadas
      await tx.bid.updateMany({
        where: { itemId, estado: 'confirmada' },
        data: { estado: 'superada' },
      })

      // Crear la nueva puja directamente confirmada
      return tx.bid.create({
        data: { subastaId: auctionId, itemId, userId, paymentMethodId, monto, estado: 'confirmada' },
      })
    })

    return NextResponse.json({ data: bid, error: null }, { status: 201 })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
