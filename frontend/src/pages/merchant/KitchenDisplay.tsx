import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ChefHat, CheckCircle, AlertCircle, LogOut, CreditCard } from "lucide-react"
import { ordersApi, authApi, getToken, merchantApi } from "@/lib/api"
import { socket } from "@/lib/socket"
import { useAuthGuard } from "@/lib/useAuthGuard"
import type { MerchantDashboard } from "@/types/api"

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
  const [dashboard, setDashboard] = useState<MerchantDashboard | null>(null)
  const navigate = useNavigate()

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const [data, summary] = await Promise.all([ordersApi.getActive(), merchantApi.getDashboard()])
      setOrders(data)
      setDashboard(summary)
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
      <div className="min-h-screen bg-[#f7f1e6] text-[#17231c] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f1e6] p-3 text-[#17231c] sm:p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {actionError && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">{actionError}</div>}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[#e4572e]">SENIN, 21 SEPTEMBER 2026</p>
            <h1 className="mt-2 text-3xl font-bold">Antrean dapur</h1>
            <p className="text-[#776f62]">Pesanan masuk real-time · verifikasi pembayaran sebelum masak</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Badge variant="secondary" className="px-3 py-2 text-sm sm:px-4 sm:text-lg">
              {pendingOrders.length} Pesanan Aktif
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#776f62] hover:text-white">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {dashboard && <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#d9d0c0] bg-white shadow-none"><CardContent className="p-4"><p className="text-xs text-[#776f62]">Order aktif</p><p className="mt-2 text-2xl font-bold">{dashboard.activeOrders}</p></CardContent></Card>
          <Card className="border-[#d9d0c0] bg-white shadow-none"><CardContent className="p-4"><p className="text-xs text-[#776f62]">Omzet hari ini</p><p className="mt-2 text-2xl font-bold">Rp {dashboard.todayRevenue.toLocaleString("id-ID")}</p></CardContent></Card>
          <Card className="border-[#d9d0c0] bg-white shadow-none"><CardContent className="p-4"><p className="text-xs text-[#776f62]">Pengeluaran</p><p className="mt-2 text-2xl font-bold">Rp {dashboard.todayExpenses.toLocaleString("id-ID")}</p></CardContent></Card>
          <Card className="border-[#d9d0c0] bg-[#e7b65a] shadow-none"><CardContent className="p-4"><p className="text-xs text-[#17231c]">Laba bersih</p><p className="mt-2 text-2xl font-bold">Rp {dashboard.todayProfit.toLocaleString("id-ID")}</p></CardContent></Card>
        </div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status)
            return (
              <Card key={order.id} data-testid={`order-${order.id}`} className="border-[#d9d0c0] bg-white shadow-none">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{order.orderNumber}</h3>
                      <p className="text-[#776f62]">{order.customerName}</p>
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
                      <div key={item.id} className="rounded-xl bg-[#f7f1e6] p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold">{item.quantity}x {item.menuItem.name}</span>
                        </div>
                        <div className="text-sm text-[#776f62] space-y-1">
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

                  <div className="flex items-center justify-between text-sm text-[#776f62] pt-2 border-t border-[#d9d0c0]">
                    <span>{order.orderType === "pickup" ? "📦 Pick-up" : "🍽️ Dine-in"}</span>
                    <span>{new Date(order.createdAt).toLocaleTimeString("id-ID")}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-2">
                      {order.status === "menunggu" && (
                        <Button disabled={busyOrderId === order.id} className="h-14 w-full bg-[#e4572e] text-base font-black hover:bg-[#c94825]" onClick={() => performAction(order.id, "start_preparing")}>
                          <ChefHat className="h-4 w-4 mr-2" />
                          {busyOrderId === order.id ? "MEMPROSES..." : "MULAI NGULEG"}
                        </Button>
                      )}
                      {order.status === "nguleg" && (
                        <>
                          {order.paymentStatus !== "paid" && <Button disabled={busyOrderId === order.id} variant="outline" className="w-full border-[#e4572e] bg-transparent text-[#e4572e]" onClick={() => performAction(order.id, "confirm_payment")}>
                            <CreditCard className="mr-2 h-4 w-4" />KONFIRMASI PEMBAYARAN
                          </Button>}
                          <Button disabled={busyOrderId === order.id || order.paymentStatus !== "paid"} className="h-14 w-full bg-[#315c3b] text-base font-black hover:bg-[#26482e]" onClick={() => performAction(order.id, "mark_ready")}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {busyOrderId === order.id ? "MEMPROSES..." : "SIAP DIAMBIL"}
                          </Button>
                        </>
                      )}
                      {order.status === "siap-diambil" && (
                        <Button disabled={busyOrderId === order.id || order.paymentStatus !== "paid"} className="h-14 w-full bg-[#315c3b] text-base font-black hover:bg-[#26482e]" onClick={() => performAction(order.id, "mark_collected")}>
                          {busyOrderId === order.id ? "MEMPROSES..." : "SUDAH DIAMBIL"}
                        </Button>
                      )}
                      {order.status === "menunggu" && order.paymentStatus === "pending" && <Button disabled={busyOrderId === order.id} variant="outline" className="w-full border-[#e4572e] bg-transparent text-[#e4572e]" onClick={() => performAction(order.id, "confirm_payment")}><CreditCard className="mr-2 h-4 w-4" />Konfirmasi pembayaran</Button>}
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
            <p className="text-[#776f62]">Semua pesanan sudah selesai</p>
          </div>
        )}
      </div>
    </div>
  )
}
