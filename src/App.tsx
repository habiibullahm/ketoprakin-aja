import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom"
import { CustomerMenu } from "@/pages/customer/CustomerMenu"
import { OrderTracking } from "@/pages/customer/OrderTracking"
import { KitchenDisplay } from "@/pages/merchant/KitchenDisplay"
import { FinancialReport } from "@/pages/merchant/FinancialReport"
import { StockManagement } from "@/pages/merchant/StockManagement"
import { DebtBook } from "@/pages/merchant/DebtBook"
import MerchantLogin from "@/pages/merchant/Login"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, ChefHat, DollarSign, Package, BookOpen, Utensils } from "lucide-react"

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Ketoprakin Aja</h1>
          <p className="text-muted-foreground">Warung Ketoprak Mas Edo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/customer/menu">
              <CardContent className="p-6 text-center">
                <Utensils className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Pesan Menu</h2>
                <p className="text-sm text-muted-foreground">
                  Pilih menu & kustomisasi ulekan
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/customer/tracking">
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Lacak Pesanan</h2>
                <p className="text-sm text-muted-foreground">
                  Pantau status pesanan Anda
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/merchant/login">
              <CardContent className="p-6 text-center">
                <ChefHat className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Kitchen Display</h2>
                <p className="text-sm text-muted-foreground">
                  Kelola pesanan masuk (Merchant)
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/merchant/login">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Laporan Keuangan</h2>
                <p className="text-sm text-muted-foreground">
                  Laba/rugi & settlement (Merchant)
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/merchant/login">
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Manajemen Stok</h2>
                <p className="text-sm text-muted-foreground">
                  Toggle ketersediaan menu (Merchant)
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/merchant/login">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Buku Kasbon</h2>
                <p className="text-sm text-muted-foreground">
                  Catat utang pelanggan (Merchant)
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MerchantNav() {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  return (
    <div className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            <span className="font-bold">Ketoprakin Aja</span>
          </Link>
          <div className="flex gap-2">
            <Button variant={isActive("/merchant/kitchen") ? "default" : "ghost"} size="sm" asChild>
              <Link to="/merchant/kitchen">Kitchen</Link>
            </Button>
            <Button variant={isActive("/merchant/financial") ? "default" : "ghost"} size="sm" asChild>
              <Link to="/merchant/financial">Keuangan</Link>
            </Button>
            <Button variant={isActive("/merchant/stock") ? "default" : "ghost"} size="sm" asChild>
              <Link to="/merchant/stock">Stok</Link>
            </Button>
            <Button variant={isActive("/merchant/debt") ? "default" : "ghost"} size="sm" asChild>
              <Link to="/merchant/debt">Kasbon</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/customer/menu" element={<CustomerMenu />} />
        <Route path="/customer/tracking" element={<OrderTracking />} />
        <Route path="/merchant/login" element={<MerchantLogin />} />
        <Route
          path="/merchant/*"
          element={
            <>
              <MerchantNav />
              <Routes>
                <Route path="kitchen" element={<KitchenDisplay />} />
                <Route path="financial" element={<FinancialReport />} />
                <Route path="stock" element={<StockManagement />} />
                <Route path="debt" element={<DebtBook />} />
              </Routes>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
