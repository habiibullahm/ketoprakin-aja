import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, ChefHat, PartyPopper, Copy, MessageCircle } from "lucide-react"
import { ordersApi } from "@/lib/api"
import { socket } from "@/lib/socket"

interface OrderItem {
  id?: number
  quantity: number
  spiceLevel: number
  garlicAmount: string
  sauceConsistency: string
  toppings: string | null
  price: string
  menuItem: { id?: number; name: string; price: string }
}

interface Order {
  trackingToken: string
  orderNumber: string
  customerName: string
  orderType: string
  status: string
  totalAmount: string
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  orderItems: OrderItem[]
}

export function OrderTracking() {
  const { trackingToken } = useParams()
  const navigate = useNavigate()
  const [enteredTrackingToken, setEnteredTrackingToken] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(Boolean(trackingToken))
  const [error, setError] = useState("")

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      const data = await ordersApi.getByTrackingToken(trackingToken!)
      setOrder(data)
      setError("")
    } catch {
      setError("Link pelacakan tidak valid atau sudah tidak tersedia")
    } finally {
      setLoading(false)
    }
  }, [trackingToken])

  useEffect(() => {
    if (trackingToken) {
      fetchOrder()
      socket.connect()
      socket.emit("join-tracking", trackingToken)
      socket.on("order-status-update", fetchOrder)
      return () => {
        socket.off("order-status-update", fetchOrder)
        socket.disconnect()
      }
    }
  }, [trackingToken, fetchOrder])

  const statusSteps = [
    { id: "menunggu", label: "Menunggu", icon: Clock },
    { id: "nguleg", label: "Nguleg Bumbu", icon: ChefHat },
    { id: "siap-diambil", label: "Siap Diambil", icon: CheckCircle },
    { id: "selesai", label: "Sudah Diambil", icon: PartyPopper },
  ]

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Loading order...</p>
      </div>
    </div>
  )

  if (!trackingToken) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <h1 className="text-xl font-bold">Lacak Pesanan</h1>
            <p className="mt-1 text-sm text-muted-foreground">Masukkan kode dari halaman konfirmasi atau pesan WhatsApp.</p>
          </div>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              const token = enteredTrackingToken.trim()
              if (/^[A-Za-z0-9_-]{16,32}$/.test(token)) navigate(`/track/${token}`)
            }}
          >
            <input
              aria-label="Kode pelacakan"
              className="w-full rounded border p-2"
              onChange={(event) => setEnteredTrackingToken(event.target.value)}
              placeholder="Contoh: k3T0p-9xY2qAbC123"
              required
              type="text"
              value={enteredTrackingToken}
            />
            <Button className="w-full" type="submit">Lacak Pesanan</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )

  if (error || !order) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">{error || "Order not found"}</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/customer/tracking")}>Coba kode lain</Button>
        </CardContent>
      </Card>
    </div>
  )

  const currentStepIndex = statusSteps.findIndex((step) => step.id === order.status)
  const isReady = order.status === "siap-diambil"
  const trackingUrl = window.location.href
  const savedPhone = sessionStorage.getItem(`trackingPhone:${order.trackingToken}`)?.replace("+", "")
  const shareText = `Halo! Pesanan ${order.orderNumber} sudah diterima Mas Edo. Pantau status ngulegnya di sini: ${trackingUrl}`

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Lacak Pesanan</h1>
          <p className="text-muted-foreground">Halo, {order.customerName}!</p>
          <p className="text-sm text-muted-foreground">Order: {order.orderNumber}</p>
        </div>

        {/* Ready banner */}
        {isReady && (
          <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 text-center animate-pulse">
            <PartyPopper className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-lg font-bold text-green-700">Pesanan Anda Siap!</p>
            <p className="text-sm text-green-600">Silakan ambil di counter.</p>
          </div>
        )}

        {/* Payment status */}
        <div className="flex items-center justify-center gap-2">
          <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"}>
            {order.paymentMethod.toUpperCase()} · {order.paymentStatus === "paid" ? "✓ Lunas" : "Menunggu Konfirmasi"}
          </Badge>
          <Badge variant={order.orderType === "pickup" ? "outline" : "secondary"}>
            {order.orderType === "pickup" ? "📦 Pick-up" : "🍽️ Dine-in"}
          </Badge>
        </div>

        {/* Status steps */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              {statusSteps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStepIndex
                const isCompleted = index < currentStepIndex
                return (
                  <div key={step.id} className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? "bg-green-500 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-gray-200 text-gray-400"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 pt-2">
                      <p className={`font-semibold ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </p>
                      {isActive && step.id === "nguleg" && (
                        <p className="text-sm text-muted-foreground mt-1">Mas Edo sedang menguleg bumbu pesanan Anda...</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Order items */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Detail Pesanan</h3>
            <div className="space-y-2">
              {order.orderItems.map((item, index) => (
                <div key={`${item.menuItem.name}-${index}`} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.menuItem.name}</span>
                  <span className="font-medium">Rp {(parseFloat(item.price) * item.quantity).toLocaleString("id-ID")}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">Rp {parseFloat(order.totalAmount).toLocaleString("id-ID")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <a href={`https://wa.me/${savedPhone ?? ""}?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Simpan ke WhatsApp</a>
          </Button>
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(trackingUrl)}><Copy className="mr-2 h-4 w-4" />Salin link</Button>
        </div>
        <Button onClick={() => window.location.href = "/"} variant="outline" className="w-full">Pesan Lagi</Button>
      </div>
    </div>
  )
}
