import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  descripcion: z.string().min(1),
  categoria: z.string().optional(),
  valorEstimado: z.number().positive().optional(),
  esCompuesto: z.boolean().default(false),
  esObraArte: z.boolean().default(false),
  artistaDisenador: z.string().optional(),
  fechaCreacionObra: z.string().datetime().optional(),
  historia: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)

    const consignments = await prisma.consignment.findMany({
      where: { userId },
      include: { photos: { select: { url: true, orden: true } }, inspection: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: consignments, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { descripcion, categoria, valorEstimado, esCompuesto, esObraArte, artistaDisenador, fechaCreacionObra, historia } = parsed.data

    const consignment = await prisma.consignment.create({
      data: {
        userId,
        descripcion,
        categoria,
        valorEstimado,
        esCompuesto,
        esObraArte,
        artistaDisenador,
        fechaCreacionObra: fechaCreacionObra ? new Date(fechaCreacionObra) : undefined,
        historia,
      },
    })

    return NextResponse.json({ data: consignment, error: null }, { status: 201 })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
