import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, CheckCircle, Clock, ChefHat, PartyPopper, Copy, MessageCircle } from "lucide-react"
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
  const [copied, setCopied] = useState<"order" | "link" | null>(null)

  const copyToClipboard = async (value: string, type: "order" | "link") => {
    await navigator.clipboard.writeText(value)
    setCopied(type)
    window.setTimeout(() => setCopied((current) => current === type ? null : current), 1800)
  }

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
    <div className="min-h-screen bg-[#f7f1e6] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Loading order...</p>
      </div>
    </div>
  )

  if (!trackingToken) return (
    <div className="min-h-screen bg-[#f7f1e6] flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-[#f7f1e6] flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-[#f7f1e6] p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Lacak Pesanan</h1>
          <p className="text-muted-foreground">Halo, {order.customerName}!</p>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <span>Order: {order.orderNumber}</span>
            <button
              type="button"
              aria-label="Salin nomor order"
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-[#315c3b] hover:bg-[#315c3b]/10"
              onClick={() => copyToClipboard(order.orderNumber, "order")}
            >
              {copied === "order" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "order" ? "Tersalin" : "Salin"}
            </button>
          </div>
        </div>

        {/* Ready banner */}
        {isReady && (
          <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 text-center animate-pulse">
            <PartyPopper className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-lg font-bold text-green-700">Pesanan Anda Siap!</p>
            <p className="text-sm text-green-600">Silakan ambil di counter.</p>
          </div>
        )}

        {order.paymentStatus !== "paid" && order.paymentMethod === "qris" && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-5 text-center">
              <h2 className="font-bold text-amber-950">Bayar via QRIS</h2>
              <p className="mt-1 text-sm text-amber-900">Scan QR mock ini, lalu tunggu konfirmasi Mas Edo.</p>
              <img src="/qris-mock.svg" alt="QRIS mock pembayaran" className="mx-auto my-4 h-56 w-48 rounded-lg shadow" />
              <p className="text-sm text-amber-900">Nominal: <strong>Rp {parseFloat(order.totalAmount).toLocaleString("id-ID")}</strong></p>
              <p className="mt-2 text-xs text-amber-800">QR ini belum terhubung payment gateway dan belum bisa dipakai untuk pembayaran nyata.</p>
            </CardContent>
          </Card>
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
                      isCompleted ? "bg-green-500 text-white" : isActive ? "bg-[#315c3b] text-white" : "bg-gray-200 text-gray-400"
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
                <span className="text-[#315c3b]">Rp {parseFloat(order.totalAmount).toLocaleString("id-ID")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <a
            className={buttonVariants({ className: "w-full bg-emerald-600 text-center hover:bg-emerald-700" })}
            href={`https://wa.me/${savedPhone ?? ""}?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Simpan ke WhatsApp</span>
          </a>
          <Button variant="outline" onClick={() => copyToClipboard(trackingUrl, "link")}>
            {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === "link" ? "Link tersalin" : "Salin link"}
          </Button>
        </div>
        <Button onClick={() => window.location.href = "/"} variant="outline" className="w-full">Pesan Lagi</Button>
      </div>
    </div>
  )
}
