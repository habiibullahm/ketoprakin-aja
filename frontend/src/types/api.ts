export type PaymentStatus = "pending" | "paid" | "failed"
export type OrderStatus = "menunggu" | "nguleg" | "siap-diambil" | "selesai"
export type PaymentMethod = "qris" | "gopay" | "ovo" | "dana" | "cash"
export type OrderType = "pickup" | "dine-in"
export type ExpenseCategory = "bahan-baku" | "gas" | "plastik" | "lainnya"

export interface ApiMenuItem {
  id: number
  name: string
  description: string
  price: string
  category: "ketoprak" | "topping" | "minuman"
  image: string
  available: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiExpense {
  id: number
  category: ExpenseCategory
  description: string
  amount: string
  date: string
  createdAt: string
}

export interface ApiDebt {
  id: number
  customerName: string
  customerPhone: string | null
  amount: string
  paid: boolean
  note: string | null
  paidAt: string | null
  createdAt: string
}

export interface ApiOrderItem {
  id: number
  orderId: number
  menuId: number
  quantity: number
  spiceLevel: number
  garlicAmount: string
  sauceConsistency: string
  toppings: string | null
  price: string
  createdAt: string
  menuItem: ApiMenuItem
}

export interface ApiOrder {
  id: number
  orderNumber: string
  trackingToken: string
  customerName: string
  customerPhone: string | null
  orderType: OrderType
  status: OrderStatus
  totalAmount: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  orderItems: ApiOrderItem[]
}

export interface MerchantDashboard {
  date: string
  activeOrders: number
  todayRevenue: number
  todayExpenses: number
  todayProfit: number
  monthRevenue: number
  monthExpenses: number
  monthProfit: number
  paidOrderCount: number
  pendingPaymentCount: number
  availableMenuCount: number
  unavailableMenuCount: number
}

export interface AuthUser { id: number; name: string; email: string; role: string }
export interface CreateExpenseInput { category: ExpenseCategory; description: string; amount: string }
export interface UpdateExpenseInput { category?: ExpenseCategory; description?: string; amount?: string; date?: string }
export interface CreateDebtInput { customerName: string; customerPhone?: string; amount: string; note?: string }
export interface CreateOrderInput { customerName: string; customerPhone?: string; orderType: OrderType; paymentMethod: PaymentMethod; notes?: string; items: Array<{ menuId: number; quantity: number; spiceLevel: number; garlicAmount: string; sauceConsistency: string; toppings: string[] }> }
export interface MenuItemInput { name: string; description?: string; price: number | string; category: "ketoprak" | "topping" | "minuman"; image?: string; available?: boolean }
