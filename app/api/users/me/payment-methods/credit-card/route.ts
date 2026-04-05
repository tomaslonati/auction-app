import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  ultimosCuatro: z.string().length(4),
  marca: z.string().min(1),
  titular: z.string().min(1),
  mesVencimiento: z.number().int().min(1).max(12),
  anioVencimiento: z.number().int().min(new Date().getFullYear()),
  esInternacional: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { ultimosCuatro, marca, titular, mesVencimiento, anioVencimiento, esInternacional } = parsed.data

    const method = await prisma.paymentMethod.create({
      data: {
        userId,
        tipo: 'tarjeta_credito',
        esInternacional,
        creditCard: { create: { ultimosCuatro, marca, titular, mesVencimiento, anioVencimiento } },
      },
      include: { creditCard: true },
    })

    return NextResponse.json({ data: method, error: null }, { status: 201 })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
