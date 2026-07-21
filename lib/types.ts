export type DiscountType = 'gift_card' | 'coupon' | 'promo_code'

export interface Discount {
  id: string
  user_id: string
  store_name: string
  discount_value: string | null
  discount_code: string | null
  category: string | null
  expiry_date: string | null
  image_url: string | null
  raw_text: string | null
  is_used: boolean
  created_at: string
  type?: DiscountType
}
