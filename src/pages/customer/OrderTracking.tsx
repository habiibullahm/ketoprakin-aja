import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, ChefHat } from "lucide-react"
import { ordersApi } from "@/lib/api"

interface OrderItem {
  id: number
  quantity: number
  spiceLevel: number
  garlicAmount: string
  sauceConsistency: string
  toppings: string | null
  price: string
  menuItem: {
    id: number
    name: string
    price: string
  }
}

interface Order {
  id: number
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
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    } else {
      setLoading(false)
      setError("No order ID provided")
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const data = await ordersApi.getById(parseInt(orderId!))
      setOrder(data)
    } catch (error) {
      console.error('Failed to fetch order:', error)
      setError("Failed to load order")
    } finally {
      setLoading(false)
    }
  }

  const statusSteps = [
    { id: "menunggu", label: "Menunggu", icon: Clock },
    { id: "nguleg", label: "Nguleg Bumbu", icon: ChefHat },
    { id: "siap-diambil", label: "Siap Diambil", icon: CheckCircle },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading order...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error || "Order not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStepIndex = statusSteps.findIndex((step) => step.id === order.status)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Lacak Pesanan</h1>
          <p className="text-muted-foreground">Order ID: {order.orderNumber}</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              {statusSteps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStepIndex
                const isCompleted = index < currentStepIndex

                return (
                  <div key={step.id} className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 pt-2">
                      <p
                        className={`font-semibold ${
                          isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isActive && step.id === "siap-diambil" && (
                        <p className="text-sm text-primary mt-1">
                          Pesanan Anda sudah siap! Silakan ambil di counter.
                        </p>
                      )}
                      {isActive && step.id === "nguleg" && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Mas Edo sedang menguleg bumbu pesanan Anda...
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Detail Pesanan</h3>
            <div className="space-y-2">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.menuItem.name}
                  </span>
                  <span className="font-medium">
                    Rp {(parseFloat(item.price) * item.quantity).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">Rp {parseFloat(order.totalAmount).toLocaleString("id-ID")}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                <p>Payment: {order.paymentMethod.toUpperCase()} ({order.paymentStatus})</p>
                <p>Type: {order.orderType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => window.location.href = "/"} className="w-full">
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  )
}
