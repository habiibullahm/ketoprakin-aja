import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ShoppingCart, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { menuApi, ordersApi } from "@/lib/api"

interface MenuItem {
  id: number
  name: string
  description: string
  price: string
  category: string
  image: string
  available: boolean
}

interface CartItem {
  menu: MenuItem
  customization: {
    spiceLevel: number
    garlicAmount: string
    sauceConsistency: string
    toppings: string[]
  }
  quantity: number
}

export function CustomerMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [customization, setCustomization] = useState({
    spiceLevel: 5,
    garlicAmount: "normal",
    sauceConsistency: "pas",
    toppings: [],
  })
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      setLoading(true)
      const data = await menuApi.getAvailable()
      setMenuItems(data)
    } catch (error) {
      console.error('Failed to fetch menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = () => {
    if (!selectedItem) return
    setCart([...cart, { menu: selectedItem, customization, quantity }])
    setSelectedItem(null)
    setQuantity(1)
    setCustomization({
      spiceLevel: 5,
      garlicAmount: "normal",
      sauceConsistency: "pas",
      toppings: [],
    })
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const total = cart.reduce((sum, item) => sum + parseFloat(item.menu.price) * item.quantity, 0)

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true)
      
      // Create order via API
      const orderData = {
        customerName: "Pelanggan", // In real app, get from user input
        items: cart.map(item => ({
          menuId: item.menu.id,
          quantity: item.quantity,
          spiceLevel: item.customization.spiceLevel,
          garlicAmount: item.customization.garlicAmount,
          sauceConsistency: item.customization.sauceConsistency,
          toppings: item.customization.toppings,
        })),
        orderType: "pickup",
        paymentMethod: "qris",
      }

      const order = await ordersApi.create(orderData)
      
      // Navigate to tracking page with order ID
      navigate(`/customer/tracking?orderId=${order.id}`)
      setCart([])
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('Gagal membuat pesanan. Silakan coba lagi.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary text-primary-foreground p-6 shadow-md">
        <h1 className="text-2xl font-bold">Warung Ketoprak Mas Edo</h1>
        <p className="text-sm opacity-90">Pilih menu & kustomisasi ulekan</p>
      </div>

      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">Menu Ketoprak</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems
            .filter((item) => item.category === "ketoprak")
            .map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-40 object-cover" />
                <CardContent className="p-4">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-primary">
                      Rp {parseFloat(item.price).toLocaleString("id-ID")}
                    </span>
                    <Button size="sm" onClick={() => setSelectedItem(item)}>
                      Pilih
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        <h2 className="text-lg font-semibold mt-6">Minuman</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {menuItems
            .filter((item) => item.category === "minuman")
            .map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rp {parseFloat(item.price).toLocaleString("id-ID")}
                  </p>
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setSelectedItem(item)}
                  >
                    + Tambah
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold">{selectedItem.name}</h3>
              
              <div>
                <Label>Jumlah Cabai (0-20)</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      setCustomization({ ...customization, spiceLevel: Math.max(0, customization.spiceLevel - 1) })
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-semibold w-12 text-center">
                    {customization.spiceLevel}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      setCustomization({ ...customization, spiceLevel: Math.min(20, customization.spiceLevel + 1) })
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Bawang Putih</Label>
                <div className="flex gap-2 mt-2">
                  {(["sedikit", "normal", "banyak"] as const).map((amount) => (
                    <Button
                      key={amount}
                      variant={customization.garlicAmount === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCustomization({ ...customization, garlicAmount: amount })}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Kekentalan Bumbu</Label>
                <div className="flex gap-2 mt-2">
                  {(["encer", "pas", "kental"] as const).map((consistency) => (
                    <Button
                      key={consistency}
                      variant={customization.sauceConsistency === consistency ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCustomization({ ...customization, sauceConsistency: consistency })}
                    >
                      {consistency}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Jumlah</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedItem(null)}>
                  Batal
                </Button>
                <Button className="flex-1" onClick={addToCart}>
                  Tambah ke Keranjang
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="font-semibold">{cart.length} item</span>
              </div>
              <span className="text-xl font-bold text-primary">
                Rp {total.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {cart.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                  <div>
                    <p className="font-medium">{item.menu.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity}x • Cabai {item.customization.spiceLevel}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeFromCart(index)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? "Memproses..." : "Checkout"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
