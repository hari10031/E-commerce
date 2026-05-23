export type ProductType = 'saree' | 'jewellery'
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface ProductImage {
  url: string
  is_primary: boolean
  color?: string
  alt_text?: string
  display_order?: number
}

export interface Variant {
  id: string
  color: string
  size: string
  quantity: number
  sold_count: number
  sku: string
  image_url?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  image_url?: string
  description?: string
  parent_id?: string | null
}

export interface Product {
  id: string
  title: string
  description?: string
  type: ProductType
  base_price: number
  discount_pct: number
  coupon_code?: string
  coupon_disc?: number
  published: boolean
  created_at: string
  category?: Category
  images: ProductImage[]
  variants: Variant[]
}

export interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  product: {
    id: string
    title: string
    images: ProductImage[]
  }
  variant: {
    id: string
    color: string
    size: string
    sku: string
  }
}

export interface Order {
  id: string
  status: OrderStatus
  total_amount: number
  discount_amount: number
  coupon_applied?: string
  refund_status?: 'requested' | 'completed' | null
  refund_reason?: string | null
  created_at: string
  updated_at: string
  address?: {
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
  order_items: OrderItem[]
}
