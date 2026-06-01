import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const paises = await prisma.pais.findMany({
      select: { numero: true, nombre: true, nombreCorto: true },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json({ data: paises, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
