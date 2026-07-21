import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { message, userId } = await req.json()

  const { data: deals } = await supabase
    .from('discounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_used', false)

  if (!deals || deals.length === 0) {
    return NextResponse.json({ reply: 'None.', deals: [] })
  }

  const today = new Date().toISOString().split('T')[0]
  const active = deals.filter((d: any) => !d.expiry_date || d.expiry_date >= today)
  const allExpired = active.length === 0

  if (allExpired) {
    return NextResponse.json({ reply: 'None, they all expired.', deals: [] })
  }

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `The user asked: "${message}"

Here are their saved deals:
${JSON.stringify(active.map((d: any) => ({ id: d.id, store_name: d.store_name, category: d.category, expiry_date: d.expiry_date })))}

Today is ${today}. Return ONLY a JSON array of deal IDs that match. If asking about a store (even with typos), match it. If asking about expiring deals, filter by date. If general, return all. Example: ["uuid1"]`,
          }],
        }],
        generationConfig: { temperature: 0 },
      }),
    }
  )

  const geminiData = await geminiRes.json()
  let ids: string[] = []
  try {
    let text = geminiData.candidates[0].content.parts[0].text.trim()
    text = text.replace(/```json|```/g, '').trim()
    ids = JSON.parse(text)
  } catch { ids = active.map((d: any) => d.id) }

  const matched = active.filter((d: any) => ids.includes(d.id))

  if (matched.length === 0) {
    return NextResponse.json({ reply: 'None.', deals: [] })
  }

  return NextResponse.json({ reply: `Found ${matched.length} deal${matched.length > 1 ? 's' : ''}:`, deals: matched })
}
