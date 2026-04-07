import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const BUCKET = 'auction-images'

const schema = z.object({
  filename: z.string().min(1),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  folder: z.enum(['consignments', 'items', 'docs']).default('consignments'),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)

    const body = await request.json()
    const parsed = schema.safeParse(
      body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { filename, contentType, folder } = parsed.data
    const ext = filename.split('.').pop()
    const path = `${folder}/${userId}/${Date.now()}.${ext}`

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

    return NextResponse.json({
      data: {
        uploadUrl: data.signedUrl,
        token: data.token,
        path,
        publicUrl,
      },
      error: null,
    })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
