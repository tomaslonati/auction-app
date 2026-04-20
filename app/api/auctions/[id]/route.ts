import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { canAccessAuction } from '@/lib/category'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        rematador: true,
        specs: { select: { clave: true, valor: true } },
        _count: { select: { items: true } },
      },
    })

    if (!auction) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    let isAuthenticated = false
    let canAccess = false
    let hasVerifiedPaymentMethod = false

    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { estado: true, categoria: true },
        })
        if (dbUser?.estado === 'aprobado') {
          isAuthenticated = true
          canAccess = canAccessAuction(dbUser.categoria, auction.categoria)
          const verifiedMethod = await prisma.paymentMethod.findFirst({
            where: { userId: user.id, estado: 'verificado' },
          })
          hasVerifiedPaymentMethod = !!verifiedMethod
        }
      }
    }

    const response = {
      ...auction,
      canJoin: canAccess && hasVerifiedPaymentMethod,
      ...(isAuthenticated ? {} : {}),
    }

    return NextResponse.json({ data: response, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
