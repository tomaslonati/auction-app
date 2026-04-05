import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)

    const methods = await prisma.paymentMethod.findMany({
      where: { userId },
      include: { bankAccount: true, creditCard: true, certifiedCheck: true },
    })

    return NextResponse.json({ data: methods, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
