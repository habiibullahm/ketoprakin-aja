import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Wallet, Trash2, Calendar } from "lucide-react"
import type { Expense } from "@/types"
import { expensesApi, merchantApi } from "@/lib/api"
import { useAuthGuard } from "@/lib/useAuthGuard"
import type { ExpenseCategory } from "@/types/api"

export function FinancialReport() {
  useAuthGuard()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [dailyRevenue, setDailyRevenue] = useState(0)
  const [dailyExpensesTotal, setDailyExpensesTotal] = useState(0)
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [newExpense, setNewExpense] = useState<{ category: ExpenseCategory; description: string; amount: string }>({ category: "bahan-baku", description: "", amount: "" })
  const [settlementDone, setSettlementDone] = useState(false)
  const [error, setError] = useState("")

  const refreshReport = useCallback(async () => {
    const [dashboard, apiExpenses] = await Promise.all([merchantApi.getDashboard(), expensesApi.getToday()])
    setDailyRevenue(dashboard.todayRevenue)
    setDailyExpensesTotal(dashboard.todayExpenses)
    setMonthlyRevenue(dashboard.monthRevenue)
    setMonthlyExpenses(dashboard.monthExpenses)
    setExpenses(apiExpenses.map((expense) => ({
      id: String(expense.id), category: expense.category, description: expense.description,
      amount: Number(expense.amount), date: new Date(expense.date),
    })))
  }, [])

  useEffect(() => {
    refreshReport().catch((cause) => setError(cause instanceof Error ? cause.message : "Laporan gagal dimuat"))
  }, [refreshReport])
  const dailyExpenses = dailyExpensesTotal
  const dailyProfit = dailyRevenue - dailyExpenses
  const monthlyProfit = monthlyRevenue - monthlyExpenses

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return

    try {
      setError("")
      await expensesApi.create(newExpense)
      await refreshReport()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pengeluaran gagal disimpan")
      return
    }
    setNewExpense({ category: "bahan-baku", description: "", amount: "" })
  }

  const deleteExpense = async (id: string) => {
    if (!confirm("Hapus pengeluaran ini?")) return
    try {
      setError("")
      await expensesApi.delete(Number(id))
      await refreshReport()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pengeluaran gagal dihapus")
    }
  }

  const handleSettlement = () => {
    if (dailyRevenue <= 0) { alert("Tidak ada saldo untuk ditarik."); return }
    setSettlementDone(true)
    alert(`Dana Rp ${dailyRevenue.toLocaleString("id-ID")} berhasil ditarik ke rekening (simulasi).`)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f1e6] p-3 sm:p-4 lg:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
          <p className="text-muted-foreground">Ringkasan laba/rugi hari ini</p>
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}. Silakan coba lagi.</p>}

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
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })}
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
                <div key={expense.id} className="flex flex-col gap-3 rounded-lg bg-[#f7f1e6] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <Badge variant="secondary" className="text-xs mt-1">{expense.category}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
            <div className="bg-[#315c3b]/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Saldo tersedia untuk ditarik</p>
              <p className="text-3xl font-bold text-[#315c3b]">Rp {dailyRevenue.toLocaleString("id-ID")}</p>
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
