import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { estado: true, registroCompletado: true },
    })

    if (!user) {
      return NextResponse.json({ data: null, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ data: { estado: user.estado, registroCompletado: user.registroCompletado }, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
