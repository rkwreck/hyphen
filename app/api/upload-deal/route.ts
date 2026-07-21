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

  if (!file || !userId) return NextResponse.json({ reply: 'Missing image or user.' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = file.type || 'image/jpeg'

  const fileName = `${userId}/${Date.now()}.jpg`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('deal-images')
    .upload(fileName, Buffer.from(bytes), { contentType: mimeType })

  const imageUrl = uploadError ? null : supabase.storage.from('deal-images').getPublicUrl(fileName).data.publicUrl

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
              text: `Extract discount information from this image and return ONLY valid JSON:
{
  "store_name": "store name or null",
  "discount_value": "e.g. 20% off, $5 off, BOGO or null",
  "discount_code": "promo code if visible or null",
  "category": "groceries | dining | retail | travel | entertainment | other",
  "expiry_date": "YYYY-MM-DD format or null"
}`,
            },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
    }
  )

  const geminiData = await geminiRes.json()
  let parsed: any = {}
  try {
    let text = geminiData.candidates[0].content.parts[0].text.trim()
    text = text.replace(/```json|```/g, '').trim()
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ reply: "Couldn't parse that image. Try a clearer photo." })
  }

  await supabase.from('discounts').insert({
    user_id: userId,
    image_url: imageUrl,
    ...parsed,
  })

  return NextResponse.json({
    reply: `Saved! ${parsed.store_name ? `Store: ${parsed.store_name}` : ''} ${parsed.discount_value ? `· ${parsed.discount_value}` : ''} ${parsed.expiry_date ? `· Expires ${parsed.expiry_date}` : ''}`.trim(),
  })
}
