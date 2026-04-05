import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const schema = z.object({
  email: z.string().email(),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  domicilio: z.string().min(1),
  paisOrigen: z.string().min(1),
  fotoDocFrenteUrl: z.string().url().optional(),
  fotoDocDorsoUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { email, nombre, apellido, domicilio, paisOrigen, fotoDocFrenteUrl, fotoDocDorsoUrl } =
      parsed.data

    // Create user in Supabase Auth (no password yet)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ data: null, error: authError.message }, { status: 400 })
    }

    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        nombre,
        apellido,
        domicilio,
        paisOrigen,
        fotoDocFrenteUrl,
        fotoDocDorsoUrl,
        estado: 'pendiente_verificacion',
      },
    })

    return NextResponse.json({ data: { userId: user.id, estado: user.estado }, error: null }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
