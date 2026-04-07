import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  banco: z.string().min(1),
  numeroCuenta: z.string().min(1),
  titular: z.string().min(1),
  numeroPaisId: z.number().int().positive(),
  moneda: z.string().min(1),
  swiftBic: z.string().optional(),
  iban: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id } = await params

    const consignment = await prisma.consignment.findFirst({
      where: { id, userId },
      include: { consignmentItems: { include: { item: { include: { subasta: true } } } } },
    })

    if (!consignment) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    // Check if any assigned auction has already started
    for (const ci of consignment.consignmentItems) {
      if (ci.item.subasta && ci.item.subasta.fechaInicio <= new Date()) {
        return NextResponse.json(
          { data: null, error: 'Auction has already started. Payout account cannot be changed.' },
          { status: 422 }
        )
      }
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const pais = await prisma.pais.findUnique({ where: { numero: parsed.data.numeroPaisId } })
    if (!pais) {
      return NextResponse.json({ data: null, error: { numeroPaisId: ['País no encontrado'] } }, { status: 422 })
    }

    const account = await prisma.payoutAccount.create({
      data: { userId, consignmentId: id, ...parsed.data },
    })

    return NextResponse.json({ data: account, error: null }, { status: 201 })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
