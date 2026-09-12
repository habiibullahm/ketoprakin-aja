import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ChefHat, CheckCircle, AlertCircle, LogOut } from "lucide-react"
import { ordersApi, authApi } from "@/lib/api"

interface OrderItem {
  id: number
  orderId: number
  menuId: number
  quantity: number
  spiceLevel: number
  garlicAmount: string
  sauceConsistency: string
  toppings: string | null
  price: string
  menuItem: {
    id: number
    name: string
    description: string
    price: string
    category: string
  }
}

interface Order {
  id: number
  orderNumber: string
  customerName: string
  customerPhone: string | null
  orderType: string
  status: string
  totalAmount: string
  paymentMethod: string
  paymentStatus: string
  notes: string | null
  createdAt: string
  updatedAt: string
  orderItems: OrderItem[]
}

export function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if logged in
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/merchant/login')
      return
    }
    fetchOrders()
  }, [navigate])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await ordersApi.getActive()
      setOrders(data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      if (error instanceof Error && error.message.includes('401')) {
        authApi.logout()
        navigate('/merchant/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus)
      // Refresh orders
      fetchOrders()
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const handleLogout = () => {
    authApi.logout()
    navigate('/merchant/login')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "menunggu":
        return "bg-yellow-500"
      case "nguleg":
        return "bg-orange-500"
      case "siap-diambil":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "menunggu":
        return Clock
      case "nguleg":
        return ChefHat
      case "siap-diambil":
        return CheckCircle
      default:
        return AlertCircle
    }
  }

  const pendingOrders = orders.filter((o) => o.status !== "selesai")

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Kitchen Display</h1>
            <p className="text-gray-400">Pesanan masuk real-time</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {pendingOrders.length} Pesanan Aktif
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status)
            return (
              <Card key={order.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{order.orderNumber}</h3>
                      <p className="text-gray-400">{order.customerName}</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {order.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="bg-gray-700 rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold">
                            {item.quantity}x {item.menuItem.name}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 space-y-1">
                          <p>🌶️ Cabai: {item.spiceLevel}</p>
                          <p>🧄 Bawang: {item.garlicAmount}</p>
                          <p>🥣 Bumbu: {item.sauceConsistency}</p>
                          {item.toppings && item.toppings !== '[]' && (
                            <p>📝 Extra: {JSON.parse(item.toppings).join(", ")}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400 pt-2 border-t border-gray-700">
                    <span>{order.orderType === "pickup" ? "📦 Pick-up" : "🍽️ Dine-in"}</span>
                    <span>{new Date(order.createdAt).toLocaleTimeString("id-ID")}</span>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "menunggu" && (
                      <Button
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                        onClick={() => updateOrderStatus(order.id, "nguleg")}
                      >
                        <ChefHat className="h-4 w-4 mr-2" />
                        Mulai Nguleg
                      </Button>
                    )}
                    {order.status === "nguleg" && (
                      <Button
                        className="flex-1 bg-green-500 hover:bg-green-600"
                        onClick={() => updateOrderStatus(order.id, "siap-diambil")}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Selesai
                      </Button>
                    )}
                    {order.status === "siap-diambil" && (
                      <Button
                        className="flex-1 bg-blue-500 hover:bg-blue-600"
                        onClick={() => updateOrderStatus(order.id, "selesai")}
                      >
                        Diambil
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {pendingOrders.length === 0 && (
          <div className="text-center py-20">
            <CheckCircle className="h-20 w-20 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold">Tidak ada pesanan</h2>
            <p className="text-gray-400">Semua pesanan sudah selesai</p>
          </div>
        )}
      </div>
    </div>
  )
}
