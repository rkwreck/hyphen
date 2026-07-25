import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, formatRetryTime } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const files = formData.getAll('images') as File[]
  const userId = formData.get('userId') as string
  const accessToken = formData.get('accessToken') as string

  if (!files.length || !userId || !accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !user || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { allowed, retryAfterMs } = rateLimit(`upload:${userId}`, 30, 24 * 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({
      error: `You have reached the daily upload limit. Try again in ${formatRetryTime(retryAfterMs)}.`,
      retryAfterMs,
    }, { status: 429 })
  }

  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Each image must be under 10MB.' }, { status: 400 })
    }
  }

  const imageUrls: string[] = []
  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const mimeType = file.type || 'image/jpeg'
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('deal-images')
      .upload(fileName, Buffer.from(bytes), { contentType: mimeType })
    if (!uploadError) {
      imageUrls.push(supabase.storage.from('deal-images').getPublicUrl(fileName).data.publicUrl)
    }
  }

  const imageParts = await Promise.all(files.map(async file => {
    const bytes = await file.arrayBuffer()
    return {
      inline_data: {
        mime_type: file.type || 'image/jpeg',
        data: Buffer.from(bytes).toString('base64'),
      }
    }
  }))

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            ...imageParts,
            {
              text: `You are an expert at identifying retail brands, gift cards, and coupons from images.

CRITICAL BRAND IDENTIFICATION RULES — apply these before anything else:
- Red bullseye circle logo OR white dog with red bullseye eye = TARGET. Always. No exceptions.
- Red background with white dog and red/white bullseye = TARGET gift card
- Green circular logo with mermaid/siren = STARBUCKS
- Yellow smiley face / smile logo = AMAZON
- Blue rectangle with yellow star = WALMART
- Orange letters or orange apron = HOME DEPOT
- Red and white "CVS" text = CVS
- Green and white "WHOLE FOODS" text = WHOLE FOODS
- Blue "BEST BUY" tag = BEST BUY
- Pink/purple "SEPHORA" = SEPHORA
- Black swoosh = NIKE
- Three stripes = ADIDAS
- Text saying "TARGET GIFTCARD" or "TARGET GIFT CARD" = TARGET

Look at ALL images carefully. Read ALL visible text including fine print.

Return ONLY this JSON, no markdown, no explanation:
{
  "store_name": "brand name - if you see a red bullseye or white dog with bullseye eye, return Target. Read any visible text like TARGET GIFTCARD. NEVER return null if brand marks are visible.",
  "discount_value": "The dollar amount or discount. For gift cards, look for a printed balance like $25 or $50. If the balance is scratched off, hidden, or not visible, return null (do NOT return the words Gift card). For coupons, return the discount like 20% off or $10 off.",
  "discount_code": "any code visible or null",
  "category": "gift_card if it is a gift card, coupon if coupon, promo_code if promo code, otherwise retail|groceries|dining|travel|entertainment|other",
  "expiry_date": "YYYY-MM-DD if visible or null"
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
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
    if (rawText) {
      let text = rawText.trim().replace(/```json|```/g, '').trim()
      parsed = JSON.parse(text)
    }
  } catch (e) {
    console.error('Gemini parse error:', e)
  }

  return NextResponse.json({
    parsed: { ...parsed, image_url: imageUrls[0] || null, all_image_urls: imageUrls }
  })
}
