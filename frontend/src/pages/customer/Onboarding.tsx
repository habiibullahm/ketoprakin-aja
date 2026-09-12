import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function CustomerOnboarding() {
  return <main className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 p-4 flex items-center justify-center">
    <Card className="w-full max-w-md"><CardContent className="p-6 space-y-5 text-center">
      <div><h1 className="text-3xl font-bold text-primary">Pesan Ketoprak</h1><p className="mt-2 text-muted-foreground">Buat akun untuk menyimpan pesanan dan mengumpulkan 10 stempel agar mendapat 1 porsi gratis.</p></div>
      <div className="space-y-3"><Button className="w-full" size="lg" asChild><Link to="/customer/login?mode=register">Buat Akun Pelanggan</Link></Button><Button className="w-full" size="lg" variant="outline" asChild><Link to="/customer/login">Saya Sudah Punya Akun</Link></Button></div>
      <Link className="block text-sm text-primary" to="/customer/menu">Lihat menu terlebih dahulu</Link>
    </CardContent></Card>
  </main>
}
