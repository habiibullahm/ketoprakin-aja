export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: "ketoprak" | "topping" | "minuman"
  available: boolean
  stockQuantity: number
  lowStockThreshold: number
}

export interface Customization {
  spiceLevel: number // 0-20 cabai
  garlicAmount: "sedikit" | "normal" | "banyak"
  sauceConsistency: "encer" | "pas" | "kental"
  toppings: string[]
}

export interface Order {
  id: string
  customerName: string
  items: {
    menu: MenuItem
    customization: Customization
    quantity: number
  }[]
  type: "dine-in" | "pickup"
  status: "menunggu" | "nguleg" | "siap-diambil" | "selesai"
  total: number
  paymentMethod: "qris" | "gopay" | "ovo" | "dana" | "cash"
  createdAt: Date
  estimatedTime?: number // menit
}

export interface Expense {
  id: string
  category: "bahan-baku" | "gas" | "plastik" | "lainnya"
  description: string
  amount: number
  date: Date
}

export interface Debt {
  id: string
  customerName: string
  amount: number
  date: Date
  paid: boolean
  note?: string
}

export interface FinancialSummary {
  dailyRevenue: number
  dailyExpenses: number
  dailyProfit: number
  monthlyRevenue: number
  monthlyExpenses: number
  monthlyProfit: number
}
