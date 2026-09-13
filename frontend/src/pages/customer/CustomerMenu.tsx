import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ShoppingCart, Plus, Minus, Clock3, MapPin, Search, UserRound, ChevronUp, X, Trash2, Pencil } from "lucide-react"
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
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null)
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
    const nextItem = { menu: selectedItem, customization, quantity }
    setCart((currentCart) => editingCartIndex === null
      ? [...currentCart, nextItem]
      : currentCart.map((item, index) => index === editingCartIndex ? nextItem : item)
    )
    setSelectedItem(null)
    setEditingCartIndex(null)
    setQuantity(1)
    setCustomization({
      spiceLevel: 5,
      garlicAmount: "normal",
      sauceConsistency: "pas",
      toppings: [],
    })
  }

  const addSimpleItem = (menu: MenuItem) => {
    setCart((currentCart) => [...currentCart, {
      menu,
      customization: { spiceLevel: 0, garlicAmount: "normal", sauceConsistency: "pas", toppings: [] },
      quantity: 1,
    }])
  }

  const removeFromCart = (index: number) => {
    setCart((currentCart) => {
      const nextCart = currentCart.filter((_, i) => i !== index)
      if (nextCart.length === 0) setIsCartOpen(false)
      return nextCart
    })
  }

  const updateCartQuantity = (index: number, delta: number) => {
    setCart((currentCart) => currentCart.map((item, itemIndex) => itemIndex === index
      ? { ...item, quantity: Math.max(1, item.quantity + delta) }
      : item
    ))
  }

  const editCartItem = (index: number) => {
    const item = cart[index]
    setEditingCartIndex(index)
    setSelectedItem(item.menu)
    setCustomization({ ...item.customization, toppings: [...item.customization.toppings] })
    setQuantity(item.quantity)
  }

  const closeItemEditor = () => {
    setSelectedItem(null)
    setEditingCartIndex(null)
    setQuantity(1)
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
    <div className={`min-h-screen bg-gray-50 ${cart.length > 0 ? "pb-28" : "pb-20"}`}>
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
                    <Button size="sm" onClick={() => {
                      setEditingCartIndex(null)
                      setSelectedItem(item)
                    }}>
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
                <Button variant="outline" className="flex-1" onClick={closeItemEditor}>
                  Batal
                </Button>
                <Button className="flex-1" onClick={addToCart}>
                  {editingCartIndex === null ? "Tambah ke Keranjang" : "Simpan Perubahan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {cart.length > 0 && (
        <>
          {!isCartOpen && (
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur">
              <button
                type="button"
                aria-expanded="false"
                aria-label="Buka keranjang"
                className="mx-auto flex w-full max-w-md items-center justify-between rounded-xl bg-primary px-4 py-3 text-left text-primary-foreground shadow-sm"
                onClick={() => setIsCartOpen(true)}
              >
                <span className="flex items-center gap-3">
                  <span className="relative"><ShoppingCart className="h-5 w-5" /><span className="absolute -right-2 -top-2 rounded-full bg-white px-1 text-[10px] font-bold text-primary">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></span>
                  <span><span className="block text-xs opacity-80">Total pesanan</span><span className="font-bold">Rp {total.toLocaleString("id-ID")}</span></span>
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold">Lihat keranjang <ChevronUp className="h-4 w-4" /></span>
              </button>
            </div>
          )}

          {isCartOpen && (
            <div className="fixed inset-0 z-50 bg-black/45" role="presentation" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsCartOpen(false)
            }}>
              <section role="dialog" aria-modal="true" aria-label="Keranjang dan checkout" className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl">
                <div className="mx-auto max-w-md">
                  <div className="mb-4 flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /><div><h2 className="font-bold">Pesananmu</h2><p className="text-xs text-muted-foreground">Masih bisa diubah sebelum checkout</p></div></div>
                    <Button size="icon" variant="ghost" aria-label="Tutup keranjang" onClick={() => setIsCartOpen(false)}><X className="h-5 w-5" /></Button>
                  </div>

                  <div className="mb-4 space-y-3">
                    {cart.map((item, index) => (
                      <div key={`${item.menu.id}-${index}`} className="rounded-xl border bg-gray-50 p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0"><p className="font-semibold">{item.menu.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.menu.category === "ketoprak" ? `Cabai ${item.customization.spiceLevel} • Bawang ${item.customization.garlicAmount} • Bumbu ${item.customization.sauceConsistency}` : "Tanpa kustomisasi"}</p></div>
                          <Button size="icon" variant="ghost" aria-label={`Hapus ${item.menu.name}`} onClick={() => removeFromCart(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <Button type="button" size="sm" variant="ghost" onClick={() => editCartItem(index)}><Pencil className="mr-1 h-3.5 w-3.5" />Ubah</Button>
                          <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`Kurangi ${item.menu.name}`} onClick={() => updateCartQuantity(index, -1)} disabled={item.quantity === 1}><Minus className="h-3.5 w-3.5" /></Button>
                            <span className="w-7 text-center font-semibold">{item.quantity}</span>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`Tambah ${item.menu.name}`} onClick={() => updateCartQuantity(index, 1)}><Plus className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button type="button" variant="outline" className="mb-4 w-full" onClick={() => setIsCartOpen(false)}>+ Tambah menu lagi</Button>

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
                  <div className="mb-3 flex items-center justify-between border-t pt-3"><span className="font-semibold">Total</span><span className="text-xl font-black text-primary">Rp {total.toLocaleString("id-ID")}</span></div>
                  <Button className="w-full" size="lg" onClick={handleCheckout} disabled={checkoutLoading}>
                    {checkoutLoading ? "Memproses..." : "Checkout"}
                  </Button>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}
