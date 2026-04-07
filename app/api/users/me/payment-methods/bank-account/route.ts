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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { banco, numeroCuenta, titular, numeroPaisId, moneda, swiftBic, iban } = parsed.data

    const pais = await prisma.pais.findUnique({ where: { numero: numeroPaisId } })
    if (!pais) {
      return NextResponse.json({ data: null, error: { numeroPaisId: ['País no encontrado'] } }, { status: 422 })
    }

    const esInternacional =
      pais.nombre.toLowerCase() !== 'argentina' ||
      !['ars', 'peso', 'pesos'].includes(moneda.toLowerCase())

    const method = await prisma.paymentMethod.create({
      data: {
        userId,
        tipo: 'cuenta_bancaria',
        esInternacional,
        bankAccount: { create: { banco, numeroCuenta, titular, numeroPaisId, moneda, swiftBic, iban } },
      },
      include: { bankAccount: true },
    })

    return NextResponse.json({ data: method, error: null }, { status: 201 })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
