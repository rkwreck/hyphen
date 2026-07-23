import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId, parsed, imageUrl } = await req.json()
  if (!userId || !parsed) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const { data, error } = await supabase.from('discounts').insert({
    user_id: userId,
    store_name: parsed.store_name,
    discount_value: parsed.discount_value,
    discount_code: parsed.discount_code || null,
    category: parsed.category || 'other',
    expiry_date: parsed.expiry_date || null,
    image_url: imageUrl || null,
    is_used: false,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deal: data })
}
