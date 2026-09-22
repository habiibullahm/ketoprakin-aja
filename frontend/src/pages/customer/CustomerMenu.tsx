import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronRight, Minus, Plus, Search, ShoppingBag, UserRound, X } from "lucide-react"
import { ApiError, menuApi, ordersApi } from "@/lib/api"
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

interface Customization {
  spiceLevel: number
  garlicAmount: string
  sauceConsistency: string
  toppings: string[]
}

interface CartItem {
  menu: MenuItem
  customization: Customization
  quantity: number
}

const BONE = "#f6efe3"
const PAPER = "#fffdf8"
const INK = "#17231c"
const MOSS = "#315c3b"
const CHILI = "#c95f3d"
const GOLD = "#dfad5b"
const LINE = "#ded3c1"

const freshCustomization = (): Customization => ({
  spiceLevel: 5,
  garlicAmount: "normal",
  sauceConsistency: "pas",
  toppings: [],
})

export function CustomerMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [customization, setCustomization] = useState<Customization>(freshCustomization)
  const [quantity, setQuantity] = useState(1)
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState("")
  const [orderType, setOrderType] = useState<"pickup" | "dine-in">("pickup")
  const [customerName, setCustomerName] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    menuApi.getAvailable()
      .then(setMenuItems)
      .catch(() => setMenuItems(mockMenuItems.filter((item) => item.available).map((item) => ({ ...item, price: String(item.price) }))))
      .finally(() => setLoading(false))
  }, [])

  const ketoprak = menuItems.filter((item) => item.category === "ketoprak")
  const drinks = menuItems.filter((item) => item.category === "minuman")
  const toppings = menuItems.filter((item) => item.category === "topping")
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const total = useMemo(() => cart.reduce((sum, item) => {
    const toppingTotal = item.customization.toppings.reduce((subtotal, toppingId) => {
      const topping = menuItems.find((menuItem) => String(menuItem.id) === toppingId)
      return subtotal + (topping ? Number(topping.price) : 0)
    }, 0)
    return sum + (Number(item.menu.price) + toppingTotal) * item.quantity
  }, 0), [cart, menuItems])

  const openCustomizer = (menu: MenuItem) => {
    const existingIndex = cart.findIndex((item) => String(item.menu.id) === String(menu.id))
    if (existingIndex >= 0) {
      const existing = cart[existingIndex]
      setEditingCartIndex(existingIndex)
      setCustomization({ ...existing.customization, toppings: [...existing.customization.toppings] })
      setQuantity(existing.quantity)
    } else {
      setEditingCartIndex(null)
      setCustomization(freshCustomization())
      setQuantity(1)
    }
    setSelectedItem(menu)
  }

  const addToCart = () => {
    if (!selectedItem) return
    const nextItem = { menu: selectedItem, customization, quantity }
    setCart((currentCart) => editingCartIndex === null
      ? [...currentCart, nextItem]
      : currentCart.map((item, index) => index === editingCartIndex ? nextItem : item))
    setSelectedItem(null)
    setEditingCartIndex(null)
    setCustomization(freshCustomization())
    setQuantity(1)
  }

  const addSimpleItem = (menu: MenuItem) => setCart((currentCart) => [...currentCart, {
    menu,
    customization: { spiceLevel: 0, garlicAmount: "normal", sauceConsistency: "pas", toppings: [] },
    quantity: 1,
  }])

  const updateCartQuantity = (index: number, delta: number) => setCart((currentCart) => currentCart.map((item, itemIndex) => itemIndex === index
    ? { ...item, quantity: Math.max(1, item.quantity + delta) }
    : item))

  const removeFromCart = (index: number) => setCart((currentCart) => currentCart.filter((_, itemIndex) => itemIndex !== index))

  const handleCheckout = async () => {
    if (!customerName.trim()) return setCheckoutError("Masukkan nama untuk pesanan Anda.")
    const normalizedPhone = normalizeIndonesianPhone(whatsappNumber)
    if (!normalizedPhone) return setCheckoutError("Masukkan nomor WhatsApp Indonesia yang aktif.")
    try {
      setCheckoutError("")
      setCheckoutLoading(true)
      const order = await ordersApi.createGuest({
        customerName: customerName.trim(),
        whatsappNumber: normalizedPhone,
        orderType,
        paymentMethod: "qris",
        items: cart.map((item) => ({
          menuId: Number(item.menu.id),
          quantity: item.quantity,
          spiceLevel: item.customization.spiceLevel,
          garlicAmount: item.customization.garlicAmount,
          sauceConsistency: item.customization.sauceConsistency,
          toppings: item.customization.toppings,
        })),
      })
      sessionStorage.setItem(`trackingPhone:${order.trackingToken}`, normalizedPhone)
      setCart([])
      navigate(`/track/${order.trackingToken}`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && typeof error.payload === "object" && error.payload !== null && "unavailableItems" in error.payload) {
        const unavailableItems = (error.payload as { unavailableItems?: Array<{ name: string; requested: number; available: number }> }).unavailableItems ?? []
        setCheckoutError(`${error.message}: ${unavailableItems.map((item) => `${item.name} (${item.available}/${item.requested})`).join(", ")}`)
        return
      }
      setCheckoutError(error instanceof Error ? error.message : "Gagal membuat pesanan.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) return <main className="grid min-h-screen place-items-center" style={{ backgroundColor: BONE, color: INK }}><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d9cdb8] border-t-[#315c3b]" /><p className="mt-3 text-sm">Memuat menu...</p></div></main>

  return (
    <main className="min-h-screen pb-28" style={{ backgroundColor: BONE, color: INK }}>
      <div className="mx-auto w-full max-w-[430px]">
        <header className="flex items-center justify-between border-b px-5 py-4" style={{ backgroundColor: PAPER, borderColor: LINE }}>
          <Link to="/" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-white" style={{ backgroundColor: MOSS }}>K</span><span><strong className="block text-sm">Ketoprakin Aja</strong><small className="block text-[10px] text-[#77776f]">Warung Mas Edo · buka sampai 14.00</small></span></Link>
          <div className="flex items-center gap-3"><Link aria-label="Lacak pesanan" to="/customer/tracking"><Search className="h-5 w-5" /></Link><Link aria-label="Akun pelanggan" to="/customer/account"><UserRound className="h-5 w-5" /></Link></div>
        </header>

        <section className="mx-4 mt-4 overflow-hidden rounded-[1.5rem] p-5 text-white" style={{ backgroundColor: MOSS }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e7f0d4]">Menu siang, tanpa antre</p>
          <div className="mt-2 flex items-end justify-between gap-4"><div><h1 className="max-w-[230px] text-[2rem] font-black leading-[0.98]">Ulekan sesuai mood kamu.</h1><p className="mt-3 max-w-[220px] text-xs leading-5 text-[#e7f0d4]">Pilih level cabai, atur bumbu, lalu ambil saat sudah siap.</p><button className="mt-4 rounded-xl px-4 py-2 text-xs font-black" style={{ backgroundColor: CHILI }} onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}>Pesan sekarang</button></div><div className="grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ backgroundColor: GOLD }}><div className="h-11 w-11 rounded-full border border-white/60" /></div></div>
          <div className="mt-3 text-[10px] font-bold text-[#e7f0d4]">Estimasi 15–20 menit</div>
        </section>

        <section id="menu" className="px-4 pt-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">Mau makan apa?</h2><span className="text-[10px] font-bold" style={{ color: CHILI }}>Lihat semua⌄</span></div><div className="grid grid-cols-2 gap-2">
          {ketoprak.map((item, index) => <article key={item.id} className="overflow-hidden rounded-2xl border" style={{ backgroundColor: PAPER, borderColor: LINE }}><div className="h-20 p-2" style={{ backgroundColor: index % 2 === 0 ? "#dca85d" : CHILI }}><span className="text-[9px] font-black uppercase text-white">{index === 0 ? "Original" : index === 1 ? "Telur" : "Spesial"}</span></div><div className="p-3"><h3 className="text-xs font-black">{item.name}</h3><p className="mt-1 h-8 overflow-hidden text-[9px] leading-4 text-[#77776f]">{item.description}</p><div className="mt-2 flex items-center justify-between"><strong className="text-xs" style={{ color: MOSS }}>Rp {Number(item.price).toLocaleString("id-ID")}</strong><button aria-label={`Pilih ${item.name}`} className="grid h-7 w-7 place-items-center rounded-lg text-white" style={{ backgroundColor: CHILI }} onClick={() => openCustomizer(item)}><Plus className="h-4 w-4" /></button></div></div></article>)}
        </div></section>

        <section className="mx-4 mt-3 rounded-2xl p-4" style={{ backgroundColor: "#e8dfd0" }}><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.16em]" style={{ color: MOSS }}>Ulekan kamu</p><h2 className="text-sm font-black">Atur rasa sebelum checkout</h2></div><span className="text-lg">✦</span></div><div className="mt-3 grid grid-cols-3 gap-2"><div className="rounded-xl p-2" style={{ backgroundColor: PAPER }}><small className="block text-[8px] text-[#77776f]">Cabai</small><b className="text-xs">{cart[0]?.customization.spiceLevel ?? 5} / 20</b></div><div className="rounded-xl p-2" style={{ backgroundColor: PAPER }}><small className="block text-[8px] text-[#77776f]">Bawang putih</small><b className="text-xs capitalize">{cart[0]?.customization.garlicAmount ?? "Normal"}</b></div><div className="rounded-xl p-2" style={{ backgroundColor: PAPER }}><small className="block text-[8px] text-[#77776f]">Bumbu</small><b className="text-xs capitalize">{cart[0]?.customization.sauceConsistency ?? "Pas"}</b></div></div></section>

        {cart.length > 0 && <section className="mx-4 mt-3 flex items-center justify-between rounded-2xl border p-3" style={{ backgroundColor: PAPER, borderColor: LINE }}><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#77776f]">Pesanan aktif</p><p className="text-xs font-black">ORD-{String(cartCount).padStart(4, "0")} · sedang nunggu</p></div><button className="text-[10px] font-black" style={{ color: CHILI }} onClick={() => setIsCartOpen(true)}>Lihat</button></section>}

        {drinks.length > 0 && <section className="px-4 pt-5"><h2 className="mb-3 text-lg font-black">Minuman</h2><div className="space-y-2">{drinks.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl border p-3" style={{ backgroundColor: PAPER, borderColor: LINE }}><div><h3 className="text-xs font-black">{item.name}</h3><p className="mt-1 text-xs" style={{ color: MOSS }}>Rp {Number(item.price).toLocaleString("id-ID")}</p></div><button className="rounded-xl px-3 py-2 text-xs font-black text-white" style={{ backgroundColor: MOSS }} onClick={() => addSimpleItem(item)}>+ Tambah</button></div>)}</div></section>}

        <footer className="px-4 pb-6 pt-8 text-center text-[10px] text-[#77776f]">Pesan sekarang, ambil saat siap.</footer>
      </div>

      {selectedItem && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedItem(null) }}><section className="w-full max-w-[430px] rounded-[1.5rem] p-5" style={{ backgroundColor: PAPER }}><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: CHILI }}>Ulekan kamu</p><h2 className="mt-1 text-xl font-black">{selectedItem.name}</h2></div><button aria-label="Tutup kustomisasi" onClick={() => setSelectedItem(null)}><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-4"><div><label className="text-xs font-bold">Cabai <span style={{ color: CHILI }}>{customization.spiceLevel}/20</span></label><div className="mt-2 flex items-center gap-2"><button className="grid h-9 w-9 place-items-center rounded-xl border" style={{ borderColor: LINE }} onClick={() => setCustomization({ ...customization, spiceLevel: Math.max(0, customization.spiceLevel - 1) })}><Minus className="h-4 w-4" /></button><input aria-label="Level cabai" className="h-2 flex-1 accent-[#315c3b]" type="range" min="0" max="20" value={customization.spiceLevel} onChange={(event) => setCustomization({ ...customization, spiceLevel: Number(event.target.value) })} /><button className="grid h-9 w-9 place-items-center rounded-xl border" style={{ borderColor: LINE }} onClick={() => setCustomization({ ...customization, spiceLevel: Math.min(20, customization.spiceLevel + 1) })}><Plus className="h-4 w-4" /></button></div></div><Choice label="Bawang putih" values={["sedikit", "normal", "banyak"]} value={customization.garlicAmount} onChange={(value) => setCustomization({ ...customization, garlicAmount: value })} /><Choice label="Kekentalan bumbu" values={["encer", "pas", "kental"]} value={customization.sauceConsistency} onChange={(value) => setCustomization({ ...customization, sauceConsistency: value })} />{toppings.length > 0 && <Choice label="Topping" values={toppings.map((item) => item.name)} value={customization.toppings.map((id) => toppings.find((item) => String(item.id) === id)?.name ?? "")} onChange={(value) => { const topping = toppings.find((item) => item.name === value); if (!topping) return; setCustomization({ ...customization, toppings: customization.toppings.includes(String(topping.id)) ? customization.toppings.filter((id) => id !== String(topping.id)) : [...customization.toppings, String(topping.id)] }) }} multi />}<div><label className="text-xs font-bold">Jumlah</label><div className="mt-2 flex items-center gap-3"><button className="grid h-9 w-9 place-items-center rounded-xl border" style={{ borderColor: LINE }} onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="h-4 w-4" /></button><b>{quantity}</b><button className="grid h-9 w-9 place-items-center rounded-xl border" style={{ borderColor: LINE }} onClick={() => setQuantity(quantity + 1)}><Plus className="h-4 w-4" /></button></div></div><button className="w-full rounded-2xl px-4 py-3 text-sm font-black text-white" style={{ backgroundColor: MOSS }} onClick={addToCart}>{editingCartIndex === null ? "Tambah ke keranjang" : "Simpan perubahan"}</button></div></section></div>}

      {cart.length > 0 && <div className="fixed bottom-0 left-0 right-0 z-40 border-t p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]" style={{ backgroundColor: "rgba(255,253,248,.95)", borderColor: LINE }}><button className="mx-auto flex w-full max-w-[430px] items-center justify-between rounded-2xl px-4 py-3 text-left text-white" style={{ backgroundColor: MOSS }} onClick={() => setIsCartOpen(true)}><span className="flex items-center gap-3"><ShoppingBag className="h-5 w-5" /><span><small className="block text-[10px] opacity-75">{cartCount} item{cartCount > 1 ? "s" : ""}</small><b>Rp {total.toLocaleString("id-ID")}</b></span></span><span className="flex items-center gap-1 text-xs font-bold">Checkout <ChevronRight className="h-4 w-4" /></span></button></div>}

      {isCartOpen && <div className="fixed inset-0 z-50 bg-black/50" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsCartOpen(false) }}><section className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-[1.5rem] p-5" style={{ backgroundColor: PAPER }}><div className="mx-auto max-w-[430px]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: CHILI }}>Checkout</p><h2 className="text-xl font-black">Pesananmu</h2></div><button aria-label="Tutup keranjang" onClick={() => setIsCartOpen(false)}><X className="h-5 w-5" /></button></div><div className="mt-4 space-y-2">{cart.map((item, index) => <div key={`${item.menu.id}-${index}`} className="flex items-center justify-between rounded-2xl border p-3" style={{ borderColor: LINE }}><div><b className="text-xs">{item.menu.name}</b><p className="text-[10px] text-[#77776f]">Cabai {item.customization.spiceLevel} · {item.customization.garlicAmount} · {item.customization.sauceConsistency}</p></div><div className="flex items-center gap-1"><button aria-label={`Kurangi ${item.menu.name}`} onClick={() => updateCartQuantity(index, -1)} className="grid h-7 w-7 place-items-center rounded-lg border" style={{ borderColor: LINE }}><Minus className="h-3 w-3" /></button><b className="w-5 text-center text-xs">{item.quantity}</b><button aria-label={`Tambah ${item.menu.name}`} onClick={() => updateCartQuantity(index, 1)} className="grid h-7 w-7 place-items-center rounded-lg border" style={{ borderColor: LINE }}><Plus className="h-3 w-3" /></button><button aria-label={`Hapus ${item.menu.name}`} onClick={() => removeFromCart(index)} className="ml-1 text-[#a33824]"><X className="h-4 w-4" /></button></div></div>)}</div><div className="mt-4 grid grid-cols-2 gap-2"><label className="text-xs font-bold">Tipe pesanan<select className="mt-1 w-full rounded-xl border bg-white p-2 font-normal" style={{ borderColor: LINE }} value={orderType} onChange={(event) => setOrderType(event.target.value as "pickup" | "dine-in")}><option value="pickup">Pick-up</option><option value="dine-in">Dine-in</option></select></label><div className="text-xs font-bold">Pembayaran<div className="mt-1 rounded-xl border bg-white p-2 font-normal" style={{ borderColor: LINE }}>QRIS (mock)</div></div></div><label className="mt-3 block text-xs font-bold">Nama pemesan<input className="mt-1 w-full rounded-xl border bg-white p-2 font-normal" style={{ borderColor: LINE }} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Contoh: Budi" /></label><label className="mt-3 block text-xs font-bold">Nomor WhatsApp<input className="mt-1 w-full rounded-xl border bg-white p-2 font-normal" style={{ borderColor: LINE }} value={whatsappNumber} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="0812-3456-7890" /></label>{checkoutError && <p className="mt-3 rounded-xl bg-[#fff0eb] p-3 text-xs text-[#a33824]">{checkoutError}</p>}<div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: LINE }}><span className="text-sm font-bold">Total</span><b className="text-xl" style={{ color: MOSS }}>Rp {total.toLocaleString("id-ID")}</b></div><button className="mt-3 w-full rounded-2xl px-4 py-3 font-black text-white" style={{ backgroundColor: MOSS }} onClick={handleCheckout} disabled={checkoutLoading}>{checkoutLoading ? "Memproses..." : "Buat pesanan · QRIS mock"}</button></div></section></div>}
    </main>
  )
}

function Choice({ label, values, value, onChange, multi = false }: { label: string; values: string[]; value: string | string[]; onChange: (value: string) => void; multi?: boolean }) {
  return <div><label className="text-xs font-bold">{label}</label><div className="mt-2 flex flex-wrap gap-2">{values.map((option) => { const active = Array.isArray(value) ? value.includes(option) : value === option; return <button key={option} type="button" className="rounded-xl border px-3 py-2 text-xs font-bold capitalize" style={{ backgroundColor: active ? MOSS : PAPER, borderColor: active ? MOSS : LINE, color: active ? "white" : INK }} onClick={() => onChange(option)}>{option}</button> })}</div>{multi && <p className="mt-1 text-[10px] text-[#77776f]">Bisa pilih lebih dari satu</p>}</div>
}
