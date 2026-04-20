import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, nombre: true, apellido: true,
        domicilio: true, numeroPais: true, categoria: true,
        estado: true, registroCompletado: true, createdAt: true,
        fotoPerfilUrl: true,
        penalties: { where: { estado: 'pendiente' }, select: { id: true, monto: true, fechaLimite: true } },
      },
    })

    if (!user) return NextResponse.json({ data: null, error: 'User not found' }, { status: 404 })

    return NextResponse.json({ data: user, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}

const updateSchema = z.object({
  domicilio: z.string().min(1).optional(),
  numeroPais: z.number().int().positive().optional(),
  fotoPerfilUrl: z.string().url().optional(),
  fotoDocFrenteUrl: z.string().url().optional(),
  fotoDocDorsoUrl: z.string().url().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: { id: true, domicilio: true, numeroPais: true },
    })

    return NextResponse.json({ data: user, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)

    const pendingPurchase = await prisma.purchase.findFirst({
      where: { compradorUserId: userId, estadoPago: 'pendiente' },
    })
    if (pendingPurchase) {
      return NextResponse.json(
        { data: null, error: 'Cannot delete account with pending purchases' },
        { status: 400 }
      )
    }

    await prisma.user.update({ where: { id: userId }, data: { estado: 'bloqueado' } })
    await supabaseAdmin.auth.admin.deleteUser(userId)

    return NextResponse.json({ data: { message: 'Account deactivated' }, error: null })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
