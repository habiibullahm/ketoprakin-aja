import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ShoppingCart, Plus, Minus, Clock3, MapPin, Search, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { menuApi, ordersApi } from "@/lib/api"
import { normalizeIndonesianPhone } from "@/lib/phone"
import { menuItems as mockMenuItems } from "@/data/mock"

interface MenuItem {
  id: number | string
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
  const [customization, setCustomization] = useState<CartItem["customization"]>({
    spiceLevel: 5,
    garlicAmount: "normal",
    sauceConsistency: "pas",
    toppings: [],
  })
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [orderType, setOrderType] = useState<"pickup" | "dine-in">("pickup")
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "gopay" | "ovo" | "dana">("qris")
  const [customerName, setCustomerName] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [checkoutError, setCheckoutError] = useState("")
  const navigate = useNavigate()

  async function fetchMenu() {
    try {
      setLoading(true)
      const data = await menuApi.getAvailable()
      setMenuItems(data)
    } catch (error) {
      console.error('Failed to fetch menu:', error)
      // Keep the ordering screen usable while the local API or database is offline.
      setMenuItems(
        mockMenuItems
          .filter((item) => item.available)
          .map((item) => ({ ...item, price: item.price.toString() }))
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenu()
  }, [])

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

  const addSimpleItem = (menu: MenuItem) => {
    setCart([...cart, {
      menu,
      customization: { spiceLevel: 0, garlicAmount: "normal", sauceConsistency: "pas", toppings: [] },
      quantity: 1,
    }])
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const total = cart.reduce((sum, item) => {
    const toppingTotal = item.customization.toppings.reduce((subtotal, toppingId) => {
      const topping = menuItems.find((menuItem) => String(menuItem.id) === toppingId)
      return subtotal + (topping ? Number(topping.price) : 0)
    }, 0)
    return sum + (parseFloat(item.menu.price) + toppingTotal) * item.quantity
  }, 0)

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      setCheckoutError("Masukkan nama untuk pesanan Anda.")
      return
    }
    const normalizedPhone = normalizeIndonesianPhone(whatsappNumber)
    if (!normalizedPhone) {
      setCheckoutError("Masukkan nomor WhatsApp Indonesia yang aktif.")
      return
    }

    try {
      setCheckoutError("")
      setCheckoutLoading(true)
      
      // Create order via API
      const orderData = {
        customerName: customerName.trim(),
        items: cart.map(item => ({
          menuId: item.menu.id,
          quantity: item.quantity,
          spiceLevel: item.customization.spiceLevel,
          garlicAmount: item.customization.garlicAmount,
          sauceConsistency: item.customization.sauceConsistency,
          toppings: item.customization.toppings,
        })),
        orderType,
        paymentMethod,
      }

      const order = await ordersApi.createGuest({ ...orderData, whatsappNumber: normalizedPhone })
      
      // Navigate to tracking page with order ID
      sessionStorage.setItem(`trackingPhone:${order.trackingToken}`, normalizedPhone)
      navigate(`/track/${order.trackingToken}`)
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
      <div className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div><h1 className="text-xl font-black text-primary">Ketoprakin Aja</h1><p className="text-xs text-muted-foreground">Warung Ketoprak Mas Edo</p></div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" asChild><Link to="/customer/tracking"><Search className="mr-1 h-4 w-4" />Lacak</Link></Button>
            <Button variant="ghost" size="icon" asChild><Link aria-label="Akun pelanggan" to="/customer/account"><UserRound className="h-4 w-4" /></Link></Button>
          </div>
        </div>
      </div>

      <div className="bg-primary px-6 py-7 text-primary-foreground shadow-md">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-80">Dibuat setelah kamu pesan</p>
          <h2 className="mt-1 text-3xl font-black">Mau ketoprak level berapa hari ini?</h2>
          <div className="mt-4 flex flex-wrap gap-4 text-sm"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-lime-300" /> Buka sekarang</span><span className="flex items-center gap-1"><Clock3 className="h-4 w-4" /> Siap ±15 menit</span><span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Pick-up atau dine-in</span></div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-4 space-y-4">
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
                    onClick={() => addSimpleItem(item)}
                  >
                    + Tambah
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      <footer className="mx-auto max-w-4xl px-4 pb-6 pt-10 text-center text-xs text-muted-foreground">
        Pemilik warung? <Link className="underline hover:text-primary" to="/merchant/login">Masuk sebagai merchant</Link>
      </footer>

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

              {menuItems.some((item) => item.category === "topping") && (
                <div>
                  <Label>Topping tambahan</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {menuItems.filter((item) => item.category === "topping").map((topping) => {
                      const selected = customization.toppings.includes(String(topping.id))
                      return <Button key={topping.id} type="button" variant={selected ? "default" : "outline"} size="sm" onClick={() => setCustomization({ ...customization, toppings: selected ? customization.toppings.filter((id) => id !== String(topping.id)) : [...customization.toppings, String(topping.id)] })}>{topping.name}</Button>
                    })}
                  </div>
                </div>
              )}

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
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <label className="space-y-1">
                <span className="text-muted-foreground">Tipe pesanan</span>
                <select className="w-full rounded border p-2" value={orderType} onChange={(event) => setOrderType(event.target.value as "pickup" | "dine-in")}>
                  <option value="pickup">Pick-up</option>
                  <option value="dine-in">Dine-in</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Pembayaran</span>
                <select className="w-full rounded border p-2" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as "qris" | "gopay" | "ovo" | "dana")}>
                  <option value="qris">QRIS</option>
                  <option value="gopay">GoPay</option>
                  <option value="ovo">OVO</option>
                  <option value="dana">DANA</option>
                </select>
              </label>
            </div>
            <label className="block mb-3 text-sm space-y-1">
              <span className="text-muted-foreground">Nama pemesan</span>
              <input
                className="w-full rounded border p-2"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Contoh: Budi"
                required
              />
            </label>
            <label className="block mb-3 text-sm space-y-1">
              <span className="text-muted-foreground">Nomor WhatsApp</span>
              <input
                className="w-full rounded border p-2"
                inputMode="tel"
                value={whatsappNumber}
                onChange={(event) => setWhatsappNumber(event.target.value)}
                placeholder="Contoh: 0812-3456 7890"
                required
              />
              {whatsappNumber && normalizeIndonesianPhone(whatsappNumber) && <span className="block text-xs text-emerald-700">Disimpan sebagai {normalizeIndonesianPhone(whatsappNumber)}</span>}
            </label>
            {checkoutError && <p className="mb-3 text-sm text-destructive">{checkoutError}</p>}
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
