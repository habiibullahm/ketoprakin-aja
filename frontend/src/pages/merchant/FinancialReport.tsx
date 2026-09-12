import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Wallet, Trash2, Calendar } from "lucide-react"
import { mockExpenses } from "@/data/mock"
import type { Expense } from "@/types"
import { expensesApi, ordersApi } from "@/lib/api"
import { useAuthGuard } from "@/lib/useAuthGuard"

export function FinancialReport() {
  useAuthGuard()
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses)
  const [dailyRevenue, setDailyRevenue] = useState(0)
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [newExpense, setNewExpense] = useState({ category: "bahan-baku", description: "", amount: "" })
  const [settlementDone, setSettlementDone] = useState(false)

  useEffect(() => {
    Promise.all([ordersApi.getAll(), expensesApi.getToday(), expensesApi.getAll()])
      .then(([orders, apiExpenses, allExpenses]) => {
        const today = new Date().toDateString()
        const thisMonth = new Date().getMonth()
        const thisYear = new Date().getFullYear()
        setDailyRevenue(
          orders
            .filter((o) => new Date(o.createdAt).toDateString() === today && o.paymentStatus === "paid")
            .reduce((s, o) => s + Number(o.totalAmount), 0)
        )
        setMonthlyRevenue(
          orders
            .filter((o) => {
              const d = new Date(o.createdAt)
              return d.getMonth() === thisMonth && d.getFullYear() === thisYear && o.paymentStatus === "paid"
            })
            .reduce((s, o) => s + Number(o.totalAmount), 0)
        )
        setMonthlyExpenses(
          allExpenses
            .filter((expense) => {
              const date = new Date(expense.date)
              return date.getMonth() === thisMonth && date.getFullYear() === thisYear
            })
            .reduce((sum, expense) => sum + Number(expense.amount), 0)
        )
        setExpenses(
          apiExpenses.map((e: any) => ({
            id: String(e.id), category: e.category, description: e.description,
            amount: Number(e.amount), date: new Date(e.date),
          }))
        )
      })
      .catch(() => undefined)
  }, [])

  const dailyExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const dailyProfit = dailyRevenue - dailyExpenses
  const monthlyProfit = monthlyRevenue - monthlyExpenses

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return
    const draft: Expense = {
      id: `E${Date.now()}`, category: newExpense.category as Expense["category"],
      description: newExpense.description, amount: Number(newExpense.amount), date: new Date(),
    }
    try {
      const created = await expensesApi.create(newExpense)
      setExpenses([...expenses, { ...draft, id: String(created.id), date: new Date(created.date) }])
    } catch {
      setExpenses([...expenses, draft])
    }
    setNewExpense({ category: "bahan-baku", description: "", amount: "" })
  }

  const deleteExpense = async (id: string) => {
    if (!confirm("Hapus pengeluaran ini?")) return
    try {
      await expensesApi.delete(Number(id))
    } catch { /* offline fallback — remove locally anyway */ }
    setExpenses(expenses.filter((e) => e.id !== id))
  }

  const handleSettlement = () => {
    if (dailyRevenue <= 0) { alert("Tidak ada saldo untuk ditarik."); return }
    setSettlementDone(true)
    alert(`Dana Rp ${dailyRevenue.toLocaleString("id-ID")} berhasil ditarik ke rekening (simulasi).`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
          <p className="text-muted-foreground">Ringkasan laba/rugi hari ini</p>
        </div>

        {/* Daily summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Omzet Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-700">Rp {dailyRevenue.toLocaleString("id-ID")}</p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" /> Pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-700">Rp {dailyExpenses.toLocaleString("id-ID")}</p>
            </CardContent>
          </Card>

          <Card className={dailyProfit >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Laba Bersih
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${dailyProfit >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                Rp {dailyProfit.toLocaleString("id-ID")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" /> Omzet Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pemasukan</p>
              <p className="text-xl font-bold text-green-700">Rp {monthlyRevenue.toLocaleString("id-ID")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Laba Bersih Estimasi</p>
              <p className={`text-xl font-bold ${monthlyProfit >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                Rp {monthlyProfit.toLocaleString("id-ID")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Add expense form */}
        <Card>
          <CardHeader><CardTitle>Tambah Pengeluaran</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Kategori</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                >
                  <option value="bahan-baku">Bahan Baku</option>
                  <option value="gas">Gas</option>
                  <option value="plastik">Plastik</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Input placeholder="Contoh: Belanja pasar" value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
              </div>
              <div>
                <Label>Jumlah (Rp)</Label>
                <Input type="number" placeholder="0" value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
              </div>
            </div>
            <Button onClick={addExpense}>Tambah Pengeluaran</Button>
          </CardContent>
        </Card>

        {/* Expense list with delete */}
        <Card>
          <CardHeader><CardTitle>Riwayat Pengeluaran Hari Ini</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada pengeluaran hari ini.</p>
              )}
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <Badge variant="secondary" className="text-xs mt-1">{expense.category}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-red-600">- Rp {expense.amount.toLocaleString("id-ID")}</p>
                    <Button size="icon" variant="ghost" onClick={() => deleteExpense(expense.id)} className="h-7 w-7 text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settlement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Pencairan Dana (Settlement)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Saldo tersedia untuk ditarik</p>
              <p className="text-3xl font-bold text-primary">Rp {dailyRevenue.toLocaleString("id-ID")}</p>
            </div>
            {settlementDone ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-green-700 font-medium">
                ✓ Dana telah ditarik ke rekening
              </div>
            ) : (
              <Button className="w-full" size="lg" onClick={handleSettlement}>
                Tarik Dana ke Rekening
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
