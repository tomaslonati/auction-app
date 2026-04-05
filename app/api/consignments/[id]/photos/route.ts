import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  photos: z.array(z.object({ url: z.string().url(), orden: z.number().int().min(0) })).min(1),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const created = await prisma.consignmentPhoto.createMany({
      data: parsed.data.photos.map((p) => ({ consignmentId: id, url: p.url, orden: p.orden })),
    })

    const totalPhotos = await prisma.consignmentPhoto.count({ where: { consignmentId: id } })

    return NextResponse.json({ data: { created: created.count, totalPhotos }, error: null }, { status: 201 })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
