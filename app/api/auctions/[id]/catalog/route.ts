import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const esObraArte = searchParams.get('esObraArte')

    let isAuthenticated = false
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { estado: true } })
        isAuthenticated = dbUser?.estado === 'aprobado'
      }
    }

    const items = await prisma.item.findMany({
      where: {
        subastaId: id,
        ...(estado ? { estado: estado as never } : {}),
        ...(esObraArte !== null ? { esObraArte: esObraArte === 'true' } : {}),
      },
      select: {
        id: true,
        numeroPieza: true,
        descripcion: true,
        estado: true,
        esObraArte: true,
        esCompuesto: true,
        images: { select: { url: true, orden: true }, take: 1 },
        ...(isAuthenticated ? { precioBase: true } : {}),
      },
    })

    return NextResponse.json({ data: items, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
