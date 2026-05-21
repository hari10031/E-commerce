export type ProductType = 'saree' | 'dress' | 'jewellery';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string | null;
  created_at: string;
}

export interface Variant {
  id: string;
  product_id: string;
  color: string;
  size: string;
  quantity: number;
  sku: string;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  color: string;
  url: string;
  is_primary: boolean;
  display_order?: number;
  alt_text?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  type: ProductType;
  category_id: string;
  category?: Category;
  base_price: number;
  discount_pct: number;
  published: boolean;
  variants?: Variant[];
  images?: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  product?: {
    id: string;
    title: string;
    type?: ProductType;
    images?: { url: string; is_primary?: boolean }[];
  };
  variant?: { id: string; color: string; size: string; sku: string };
}

export interface Address {
  id?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  user_id?: string;
  user?: { id: string; name: string; phone?: string };
  address?: Address;
  status: OrderStatus;
  total_amount: number;
  discount_amount?: number;
  coupon_applied?: string;
  order_items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'employee';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueThisMonth: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockVariants: number;
  totalProducts: number;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface CategorySalesPoint {
  type: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusCount {
  status: OrderStatus;
  count: number;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  product_title: string;
  type: ProductType;
  category: string;
  color: string;
  size: string;
  quantity: number;
  sold: number;
  sku: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
