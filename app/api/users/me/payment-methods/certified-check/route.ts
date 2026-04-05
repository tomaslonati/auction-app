import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  banco: z.string().min(1),
  numeroCheque: z.string().min(1),
  monto: z.number().positive(),
  fechaVencimiento: z.string().datetime(),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { banco, numeroCheque, monto, fechaVencimiento } = parsed.data

    const method = await prisma.paymentMethod.create({
      data: {
        userId,
        tipo: 'cheque_certificado',
        certifiedCheck: {
          create: {
            banco,
            numeroCheque,
            monto,
            montoDisponible: monto,
            fechaVencimiento: new Date(fechaVencimiento),
          },
        },
      },
      include: { certifiedCheck: true },
    })

    return NextResponse.json({ data: method, error: null }, { status: 201 })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
