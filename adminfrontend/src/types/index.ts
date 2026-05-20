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
  variant_color: string;
  image_url: string;
  is_primary: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  type: ProductType;
  category_id: string;
  category?: Category;
  base_price: number;
  discount_percent: number;
  published: boolean;
  variants?: Variant[];
  images?: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price: number;
  product?: Product;
  variant?: Variant;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  address: Address;
  status: OrderStatus;
  total: number;
  items?: OrderItem[];
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

export interface ApiAnalyticsDashboard {
  stats: DashboardStats;
  daily_sales: SalesDataPoint[];
  category_sales: CategorySalesPoint[];
  order_status_counts: OrderStatusCount[];
  recent_orders: Order[];
  inventory: InventoryItem[];
}
