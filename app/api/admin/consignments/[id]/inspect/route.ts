import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.discriminatedUnion('resultado', [
  z.object({
    resultado: z.literal('rechazado'),
    motivoRechazo: z.string().min(1),
    costoDevolucion: z.number().min(0).optional(),
  }),
  z.object({
    resultado: z.literal('aceptado'),
    valorBaseAsignado: z.number().positive(),
    comisionPorcentaje: z.number().min(0).max(100),
    fechaSubastaEstimada: z.string().datetime().optional(),
    costoDevolucion: z.number().min(0).optional(),
  }),
])

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params

    const consignment = await prisma.consignment.findUnique({
      where: { id },
      include: { user: { select: { id: true, nombre: true } } },
    })
    if (!consignment) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const data = parsed.data

    const inspection = await prisma.consignmentInspection.create({
      data: {
        consignmentId: id,
        resultado: data.resultado,
        motivoRechazo: data.resultado === 'rechazado' ? data.motivoRechazo : undefined,
        valorBaseAsignado: data.resultado === 'aceptado' ? data.valorBaseAsignado : undefined,
        comisionPorcentaje: data.resultado === 'aceptado' ? data.comisionPorcentaje : undefined,
        fechaSubastaEstimada: data.resultado === 'aceptado' && data.fechaSubastaEstimada ? new Date(data.fechaSubastaEstimada) : undefined,
        costoDevolucion: data.costoDevolucion,
      },
    })

    const newEstado = data.resultado === 'rechazado' ? 'rechazado' : 'aceptado'
    await prisma.consignment.update({ where: { id }, data: { estado: newEstado } })

    await prisma.notification.create({
      data: {
        userId: consignment.userId,
        tipo: 'inspeccion',
        titulo: data.resultado === 'aceptado' ? 'Inspección aprobada' : 'Inspección rechazada',
        cuerpo: data.resultado === 'aceptado'
          ? `Tu bien fue inspeccionado y aceptado. Valor base: ${data.valorBaseAsignado}. Comisión: ${data.comisionPorcentaje}%.`
          : `Tu bien fue rechazado. Motivo: ${data.motivoRechazo}.`,
        metadata: { consignmentId: id, inspectionId: inspection.id },
      },
    })

    return NextResponse.json({ data: inspection, error: null }, { status: 201 })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
