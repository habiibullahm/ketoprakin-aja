import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { CustomerMenu } from "@/pages/customer/CustomerMenu"
import { OrderTracking } from "@/pages/customer/OrderTracking"
import { CustomerLogin } from "@/pages/customer/Login"
import { CustomerAccount } from "@/pages/customer/Account"
import { KitchenDisplay } from "@/pages/merchant/KitchenDisplay"
import { FinancialReport } from "@/pages/merchant/FinancialReport"
import { StockManagement } from "@/pages/merchant/StockManagement"
import { DebtBook } from "@/pages/merchant/DebtBook"
import MerchantLogin from "@/pages/merchant/Login"
import { Button } from "@/components/ui/button"
import { authApi } from "@/lib/api"
import { ChefHat, DollarSign, Package, BookOpen, Menu, X, Store } from "lucide-react"

const merchantLinks = [
  { to: "/merchant/kitchen", label: "Kitchen", icon: ChefHat },
  { to: "/merchant/stock", label: "Stok", icon: Package },
  { to: "/merchant/financial", label: "Keuangan", icon: DollarSign },
  { to: "/merchant/debt", label: "Kasbon", icon: BookOpen },
]

function MerchantShell() {
  const [checking, setChecking] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    authApi.me().then((user) => {
      if (user.role !== "merchant") throw new Error("Merchant access required")
      setChecking(false)
    }).catch(() => {
      authApi.logout()
      navigate("/merchant/login", { replace: true })
    })
  }, [navigate])

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">Memeriksa akses merchant...</div>

  const nav = <nav className="space-y-2 p-4">
    {merchantLinks.map(({ to, label, icon: Icon }) => <Button key={to} variant={location.pathname === to ? "default" : "ghost"} className="w-full justify-start" asChild onClick={() => setDrawerOpen(false)}><Link to={to}><Icon className="mr-3 h-5 w-5" />{label}</Link></Button>)}
    <div className="pt-6"><Button variant="outline" className="w-full" onClick={() => { authApi.logout(); navigate("/merchant/login") }}>Logout</Button></div>
  </nav>

  return <div className="min-h-screen bg-gray-100 md:flex">
    <aside className="hidden w-60 shrink-0 bg-white shadow md:block">
      <Link to="/merchant/kitchen" className="flex h-16 items-center gap-2 border-b px-5 font-black text-primary"><Store className="h-5 w-5" />Ketoprakin Aja</Link>
      {nav}
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
        <button aria-label="Buka menu merchant" onClick={() => setDrawerOpen(true)}><Menu className="h-6 w-6" /></button><b>Operasional Warung</b><span className="w-6" />
      </header>
      {drawerOpen && <div className="fixed inset-0 z-50 md:hidden"><button aria-label="Tutup menu merchant" className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} /><aside className="relative h-full w-72 bg-white shadow-xl"><div className="flex h-16 items-center justify-between border-b px-4"><b>Menu Merchant</b><button aria-label="Tutup menu" onClick={() => setDrawerOpen(false)}><X /></button></div>{nav}</aside></div>}
      <Routes>
        <Route path="kitchen" element={<KitchenDisplay />} />
        <Route path="financial" element={<FinancialReport />} />
        <Route path="stock" element={<StockManagement />} />
        <Route path="debt" element={<DebtBook />} />
        <Route path="*" element={<Navigate to="/merchant/kitchen" replace />} />
      </Routes>
    </div>
  </div>
}

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<CustomerMenu />} />
    <Route path="/customer/menu" element={<Navigate to="/" replace />} />
    <Route path="/customer" element={<Navigate to="/" replace />} />
    <Route path="/customer/login" element={<CustomerLogin />} />
    <Route path="/customer/account" element={<CustomerAccount />} />
    <Route path="/customer/tracking" element={<OrderTracking />} />
    <Route path="/track/:trackingToken" element={<OrderTracking />} />
    <Route path="/merchant/login" element={<MerchantLogin />} />
    <Route path="/merchant/*" element={<MerchantShell />} />
  </Routes></BrowserRouter>
}
