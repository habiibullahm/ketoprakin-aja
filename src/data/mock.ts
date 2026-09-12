import type { MenuItem, Order, Expense, Debt } from "@/types"

export const menuItems: MenuItem[] = [
  {
    id: "k1",
    name: "Ketoprak Original",
    description: "Lontong, tahu, tauge, bihun, bumbu kacang ulek manual",
    price: 15000,
    image: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop",
    category: "ketoprak",
    available: true,
  },
  {
    id: "k2",
    name: "Ketoprak Telur",
    description: "Ketoprak original + telur rebus",
    price: 18000,
    image: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop",
    category: "ketoprak",
    available: true,
  },
  {
    id: "k3",
    name: "Ketoprak Spesial",
    description: "Ketoprak original + telur + sate tahu + kerupuk ekstra",
    price: 25000,
    image: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop",
    category: "ketoprak",
    available: true,
  },
  {
    id: "t1",
    name: "Extra Tahu",
    description: "Tahu goreng tambahan",
    price: 3000,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    category: "topping",
    available: true,
  },
  {
    id: "t2",
    name: "Extra Kerupuk",
    description: "Kerupuk kanji tambahan",
    price: 2000,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    category: "topping",
    available: true,
  },
  {
    id: "m1",
    name: "Es Teh Manis",
    description: "Teh manis dingin segar",
    price: 5000,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
    category: "minuman",
    available: true,
  },
  {
    id: "m2",
    name: "Es Jeruk",
    description: "Jeruk peras segar",
    price: 7000,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
    category: "minuman",
    available: false,
  },
]

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "Budi Santoso",
    items: [
      {
        menu: menuItems[1],
        customization: {
          spiceLevel: 5,
          garlicAmount: "normal",
          sauceConsistency: "pas",
          toppings: ["Extra Kerupuk"],
        },
        quantity: 1,
      },
    ],
    type: "pickup",
    status: "nguleg",
    total: 20000,
    paymentMethod: "qris",
    createdAt: new Date(Date.now() - 10 * 60000),
    estimatedTime: 15,
  },
  {
    id: "ORD-002",
    customerName: "Siti Rahayu",
    items: [
      {
        menu: menuItems[2],
        customization: {
          spiceLevel: 10,
          garlicAmount: "banyak",
          sauceConsistency: "kental",
          toppings: [],
        },
        quantity: 2,
      },
    ],
    type: "dine-in",
    status: "menunggu",
    total: 50000,
    paymentMethod: "gopay",
    createdAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "ORD-003",
    customerName: "Ahmad Wijaya",
    items: [
      {
        menu: menuItems[0],
        customization: {
          spiceLevel: 0,
          garlicAmount: "sedikit",
          sauceConsistency: "encer",
          toppings: ["Extra Tahu"],
        },
        quantity: 1,
      },
    ],
    type: "pickup",
    status: "siap-diambil",
    total: 18000,
    paymentMethod: "dana",
    createdAt: new Date(Date.now() - 20 * 60000),
    estimatedTime: 10,
  },
]

export const mockExpenses: Expense[] = [
  {
    id: "E1",
    category: "bahan-baku",
    description: "Belanja pasar: tahu, tauge, bumbu",
    amount: 150000,
    date: new Date(),
  },
  {
    id: "E2",
    category: "gas",
    description: "Gas LPG 3kg",
    amount: 25000,
    date: new Date(),
  },
  {
    id: "E3",
    category: "plastik",
    description: "Kantong plastik & wadah",
    amount: 15000,
    date: new Date(),
  },
]

export const mockDebts: Debt[] = [
  {
    id: "D1",
    customerName: "Pak RT",
    amount: 45000,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    paid: false,
    note: "Pesanan 3 porsi untuk rapat RT",
  },
  {
    id: "D2",
    customerName: "Ibu Kos",
    amount: 25000,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    paid: true,
  },
]
