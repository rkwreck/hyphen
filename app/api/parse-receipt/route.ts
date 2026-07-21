import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('receipt') as File
  const discountValue = formData.get('discountValue') as string

  if (!file) return NextResponse.json({ saved: null }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = file.type || 'image/jpeg'

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
              text: `This is a receipt. The customer used a discount: "${discountValue}".
Extract the subtotal before discount and the final amount paid (excluding tax).
Return ONLY valid JSON:
{
  "subtotal_before": 45.00,
  "amount_paid": 38.00,
  "discount_used": 7.00
}
If you cannot determine these values, return { "subtotal_before": null, "amount_paid": null, "discount_used": null }`,
            },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
    }
  )

  const data = await geminiRes.json()
  try {
    let text = data.candidates[0].content.parts[0].text.trim()
    text = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(text)
    return NextResponse.json({ saved: parsed.discount_used })
  } catch {
    return NextResponse.json({ saved: null })
  }
}
