import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  specs: z.array(z.object({ clave: z.string().min(1), valor: z.string().min(1) })).min(1),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(request)
    const { id } = await params

    const consignment = await prisma.consignment.findFirst({ where: { id, userId } })
    if (!consignment) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    await prisma.consignmentSpec.deleteMany({ where: { consignmentId: id } })
    await prisma.consignmentSpec.createMany({
      data: parsed.data.specs.map((s) => ({ consignmentId: id, clave: s.clave, valor: s.valor })),
    })

    const specs = await prisma.consignmentSpec.findMany({
      where: { consignmentId: id },
      select: { clave: true, valor: true },
    })

    return NextResponse.json({ data: specs, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
