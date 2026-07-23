import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('image') as File
  const userId = formData.get('userId') as string

  if (!file || !userId) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = file.type || 'image/jpeg'

  // Upload image to storage
  const fileName = `${userId}/${Date.now()}.jpg`
  const { error: uploadError } = await supabase.storage
    .from('deal-images')
    .upload(fileName, Buffer.from(bytes), { contentType: mimeType })

  const imageUrl = uploadError ? null : supabase.storage.from('deal-images').getPublicUrl(fileName).data.publicUrl

  // Parse with Gemini
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            {
              text: `Extract discount information from this image. Return ONLY valid JSON with no markdown:
{
  "store_name": "brand or store name from logo/text, or null if unclear",
  "discount_value": "e.g. 20% off, $5 off, $50 gift card, or null if unclear",
  "discount_code": "promo code if visible, or null",
  "category": "gift_card | coupon | promo_code | groceries | dining | retail | travel | entertainment | other",
  "expiry_date": "YYYY-MM-DD if visible, or null"
}`,
            },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
    }
  )

  const geminiData = await geminiRes.json()
  let parsed: any = { store_name: null, discount_value: null, discount_code: null, category: 'other', expiry_date: null }
  try {
    let text = geminiData.candidates[0].content.parts[0].text.trim()
    text = text.replace(/```json|```/g, '').trim()
    parsed = JSON.parse(text)
  } catch {}

  return NextResponse.json({ parsed: { ...parsed, image_url: imageUrl } })
}
