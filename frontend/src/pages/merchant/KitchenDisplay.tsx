import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ChefHat, CheckCircle, AlertCircle, LogOut, CreditCard } from "lucide-react"
import { ordersApi, authApi, getToken } from "@/lib/api"
import { socket } from "@/lib/socket"
import { useAuthGuard } from "@/lib/useAuthGuard"

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
  useAuthGuard()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null)
  const [actionError, setActionError] = useState("")
  const navigate = useNavigate()

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await ordersApi.getActive()
      setOrders(data)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      if (error instanceof Error && (error.message.includes("Unauthorized") || error.message.includes("401"))) {
        authApi.logout()
        navigate("/merchant/login")
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchOrders()
    socket.auth = { token: getToken() }
    socket.connect()
    socket.emit("join-kitchen")
    socket.on("new-order", fetchOrders)
    socket.on("order-status-update", fetchOrders)
    return () => {
      socket.off("new-order", fetchOrders)
      socket.off("order-status-update", fetchOrders)
      socket.disconnect()
    }
  }, [fetchOrders])

  const performAction = async (orderId: number, action: string) => {
    try {
      setActionError("")
      setBusyOrderId(orderId)
      await ordersApi.performAction(orderId, action)
      await fetchOrders()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Aksi gagal. Silakan coba lagi.")
    } finally {
      setBusyOrderId(null)
    }
  }

  const handleLogout = () => {
    authApi.logout()
    navigate("/merchant/login")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "menunggu": return "bg-yellow-500"
      case "nguleg": return "bg-orange-500"
      case "siap-diambil": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "menunggu": return Clock
      case "nguleg": return ChefHat
      case "siap-diambil": return CheckCircle
      default: return AlertCircle
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
        {actionError && <div className="mb-4 rounded-lg border border-red-500 bg-red-950 p-3 text-red-100">{actionError}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Kitchen Display</h1>
            <p className="text-gray-400">Pesanan masuk real-time</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {pendingOrders.length} Pesanan Aktif
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-white">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status)
            return (
              <Card key={order.id} data-testid={`order-${order.id}`} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{order.orderNumber}</h3>
                      <p className="text-gray-400">{order.customerName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={getStatusColor(order.status)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {order.status}
                      </Badge>
                      <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"} className="text-xs">
                        {order.paymentMethod.toUpperCase()} · {order.paymentStatus === "paid" ? "✓ Lunas" : "Belum Bayar"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="bg-gray-700 rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold">{item.quantity}x {item.menuItem.name}</span>
                        </div>
                        <div className="text-sm text-gray-300 space-y-1">
                          <p>🌶️ Cabai: {item.spiceLevel}</p>
                          <p>🧄 Bawang: {item.garlicAmount}</p>
                          <p>🥣 Bumbu: {item.sauceConsistency}</p>
                          {item.toppings && item.toppings !== "[]" && (
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

                  <div className="space-y-2">
                    <div className="space-y-2">
                      {order.status === "menunggu" && (
                        <Button disabled={busyOrderId === order.id} className="h-14 w-full bg-orange-500 text-base font-black hover:bg-orange-600" onClick={() => performAction(order.id, "start_preparing")}>
                          <ChefHat className="h-4 w-4 mr-2" />
                          {busyOrderId === order.id ? "MEMPROSES..." : "MULAI NGULEG"}
                        </Button>
                      )}
                      {order.status === "nguleg" && (
                        <Button disabled={busyOrderId === order.id} className="h-14 w-full bg-green-500 text-base font-black hover:bg-green-600" onClick={() => performAction(order.id, order.paymentStatus === "paid" ? "mark_ready" : "mark_ready_and_paid")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {busyOrderId === order.id ? "MEMPROSES..." : order.paymentStatus === "paid" ? "SIAP DIAMBIL" : "LUNAS & SIAP DIAMBIL"}
                        </Button>
                      )}
                      {order.status === "siap-diambil" && (
                        <Button disabled={busyOrderId === order.id} className="h-14 w-full bg-blue-500 text-base font-black hover:bg-blue-600" onClick={() => performAction(order.id, order.paymentStatus === "paid" ? "mark_collected" : "mark_collected_and_paid")}>
                          {busyOrderId === order.id ? "MEMPROSES..." : order.paymentStatus === "paid" ? "SUDAH DIAMBIL" : "LUNAS & SUDAH DIAMBIL"}
                        </Button>
                      )}
                      {order.status === "menunggu" && order.paymentStatus === "pending" && <Button disabled={busyOrderId === order.id} variant="outline" className="w-full border-gray-600 bg-transparent text-gray-200" onClick={() => performAction(order.id, "mark_paid")}><CreditCard className="mr-2 h-4 w-4" />Tandai lunas lebih awal</Button>}
                    </div>
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
