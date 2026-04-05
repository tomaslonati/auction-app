import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  auctionId: z.string().uuid(),
  numeroPieza: z.string().min(1),
  descripcion: z.string().min(1),
  precioBase: z.number().positive(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params

    const consignment = await prisma.consignment.findUnique({
      where: { id },
      include: { inspection: true },
    })

    if (!consignment) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
    if (consignment.estado !== 'aceptado' || consignment.inspection?.userAcepta !== true) {
      return NextResponse.json({ data: null, error: 'Consignment not accepted by user' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { auctionId, numeroPieza, descripcion, precioBase } = parsed.data

    const auction = await prisma.auction.findUnique({ where: { id: auctionId } })
    if (!auction) return NextResponse.json({ data: null, error: 'Auction not found' }, { status: 404 })

    const item = await prisma.item.create({
      data: {
        numeroPieza,
        descripcion,
        precioBase,
        duenUserId: consignment.userId,
        subastaId: auctionId,
        esCompuesto: consignment.esCompuesto,
        esObraArte: consignment.esObraArte,
        artistaDisenador: consignment.artistaDisenador,
        fechaCreacionObra: consignment.fechaCreacionObra,
        historia: consignment.historia,
      },
    })

    await prisma.consignmentItem.create({
      data: { consignmentId: id, itemId: item.id },
    })

    await prisma.consignment.update({ where: { id }, data: { estado: 'subastado' } })

    return NextResponse.json({ data: { item }, error: null }, { status: 201 })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
