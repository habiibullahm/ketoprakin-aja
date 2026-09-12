import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react"
import { mockOrders, mockExpenses } from "@/data/mock"
import type { Expense } from "@/types"

export function FinancialReport() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses)
  const [newExpense, setNewExpense] = useState({ category: "bahan-baku", description: "", amount: "" })

  const dailyRevenue = mockOrders.reduce((sum, o) => sum + o.total, 0)
  const dailyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const dailyProfit = dailyRevenue - dailyExpenses

  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount) return
    setExpenses([
      ...expenses,
      {
        id: `E${expenses.length + 1}`,
        category: newExpense.category as Expense["category"],
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        date: new Date(),
      },
    ])
    setNewExpense({ category: "bahan-baku", description: "", amount: "" })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
          <p className="text-muted-foreground">Ringkasan laba/rugi hari ini</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Omzet Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-700">
                Rp {dailyRevenue.toLocaleString("id-ID")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-700">
                Rp {dailyExpenses.toLocaleString("id-ID")}
              </p>
            </CardContent>
          </Card>

          <Card className={dailyProfit >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Laba Bersih
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${dailyProfit >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                Rp {dailyProfit.toLocaleString("id-ID")}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tambah Pengeluaran</CardTitle>
          </CardHeader>
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
                <Input
                  placeholder="Contoh: Belanja pasar"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Jumlah (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={addExpense}>Tambah Pengeluaran</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pengeluaran Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {expense.category}
                    </Badge>
                  </div>
                  <p className="font-bold text-red-600">- Rp {expense.amount.toLocaleString("id-ID")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Pencairan Dana (Settlement)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Saldo tersedia untuk ditarik</p>
              <p className="text-3xl font-bold text-primary">
                Rp {dailyRevenue.toLocaleString("id-ID")}
              </p>
            </div>
            <Button className="w-full" size="lg">
              Tarik Dana ke Rekening
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
