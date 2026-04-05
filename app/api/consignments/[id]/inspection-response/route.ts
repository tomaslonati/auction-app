import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({ userAcepta: z.boolean() })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id } = await params

    const consignment = await prisma.consignment.findFirst({
      where: { id, userId },
      include: { inspection: true },
    })

    if (!consignment) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
    if (!consignment.inspection || consignment.inspection.resultado !== 'aceptado') {
      return NextResponse.json({ data: null, error: 'No accepted inspection to respond to' }, { status: 400 })
    }
    if (consignment.inspection.userAcepta !== null) {
      return NextResponse.json({ data: null, error: 'Already responded to inspection' }, { status: 409 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { userAcepta } = parsed.data

    await prisma.consignmentInspection.update({
      where: { id: consignment.inspection.id },
      data: { userAcepta, respondidoEn: new Date() },
    })

    const newEstado = userAcepta ? 'aceptado' : 'rechazado'
    const updated = await prisma.consignment.update({
      where: { id },
      data: { estado: newEstado },
    })

    const response: Record<string, unknown> = { consignment: updated }
    if (!userAcepta && consignment.inspection.costoDevolucion) {
      response.costoDevolucion = consignment.inspection.costoDevolucion
    }

    return NextResponse.json({ data: response, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
