import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock } from "lucide-react"
import { mockDebts } from "@/data/mock"
import type { Debt } from "@/types"

export function DebtBook() {
  const [debts, setDebts] = useState<Debt[]>(mockDebts)
  const [newDebt, setNewDebt] = useState({ customerName: "", amount: "", note: "" })

  const addDebt = () => {
    if (!newDebt.customerName || !newDebt.amount) return
    setDebts([
      ...debts,
      {
        id: `D${debts.length + 1}`,
        customerName: newDebt.customerName,
        amount: parseFloat(newDebt.amount),
        date: new Date(),
        paid: false,
        note: newDebt.note || undefined,
      },
    ])
    setNewDebt({ customerName: "", amount: "", note: "" })
  }

  const togglePaid = (id: string) => {
    setDebts(debts.map((d) => (d.id === id ? { ...d, paid: !d.paid } : d)))
  }

  const unpaidTotal = debts.filter((d) => !d.paid).reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Buku Kasbon</h1>
          <p className="text-muted-foreground">Catat utang pelanggan</p>
        </div>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <p className="text-sm text-orange-700">Total kasbon belum dibayar</p>
            <p className="text-3xl font-bold text-orange-700">
              Rp {unpaidTotal.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tambah Kasbon Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nama Pelanggan</Label>
                <Input
                  placeholder="Contoh: Pak RT"
                  value={newDebt.customerName}
                  onChange={(e) => setNewDebt({ ...newDebt, customerName: e.target.value })}
                />
              </div>
              <div>
                <Label>Jumlah (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newDebt.amount}
                  onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>Catatan (opsional)</Label>
                <Input
                  placeholder="Contoh: Pesanan 3 porsi"
                  value={newDebt.note}
                  onChange={(e) => setNewDebt({ ...newDebt, note: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={addDebt}>Tambah Kasbon</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Kasbon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {debts.map((debt) => (
                <div key={debt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{debt.customerName}</p>
                      <Badge variant={debt.paid ? "default" : "secondary"}>
                        {debt.paid ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {debt.paid ? "Lunas" : "Belum Bayar"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(debt.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {debt.note && <p className="text-sm text-muted-foreground mt-1">📝 {debt.note}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-lg font-bold ${debt.paid ? "text-green-600" : "text-orange-600"}`}>
                      Rp {debt.amount.toLocaleString("id-ID")}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => togglePaid(debt.id)}>
                      {debt.paid ? "Batalkan" : "Lunasi"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
