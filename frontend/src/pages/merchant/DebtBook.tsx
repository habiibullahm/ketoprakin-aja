import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Trash2 } from "lucide-react"
import type { Debt } from "@/types"
import { debtsApi } from "@/lib/api"
import { useAuthGuard } from "@/lib/useAuthGuard"

export function DebtBook() {
  useAuthGuard()
  const [debts, setDebts] = useState<Debt[]>([])
  const [newDebt, setNewDebt] = useState({ customerName: "", amount: "", note: "" })
  const [error, setError] = useState("")

  useEffect(() => {
    debtsApi.getAll()
      .then((data) => setDebts(data.map((debt) => ({
        id: String(debt.id), customerName: debt.customerName, amount: Number(debt.amount),
        date: new Date(debt.createdAt), paid: debt.paid, note: debt.note ?? undefined,
      }))))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Kasbon gagal dimuat"))
  }, [])

  const addDebt = async () => {
    if (!newDebt.customerName || !newDebt.amount) return
    const draft = { id: `D${Date.now()}`, customerName: newDebt.customerName, amount: Number(newDebt.amount), date: new Date(), paid: false, note: newDebt.note || undefined }
    try {
      setError("")
      const created = await debtsApi.create(newDebt)
      setDebts([...debts, { ...draft, id: String(created.id), date: new Date(created.createdAt) }])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kasbon gagal disimpan")
      return
    }
    setNewDebt({ customerName: "", amount: "", note: "" })
  }

  const togglePaid = async (id: string) => {
    const debt = debts.find((item) => item.id === id)
    if (!debt) return
    try {
      setError("")
      const updated = debt.paid ? await debtsApi.markAsUnpaid(Number(id)) : await debtsApi.markAsPaid(Number(id))
      setDebts(debts.map((item) => item.id === id ? { ...item, paid: updated.paid } : item))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Status kasbon gagal diubah")
    }
  }

  const deleteDebt = async (id: string) => {
    if (!confirm("Hapus kasbon ini?")) return
    try {
      setError("")
      await debtsApi.delete(Number(id))
      setDebts(debts.filter((item) => item.id !== id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kasbon gagal dihapus")
    }
  }

  const unpaidTotal = debts.filter((d) => !d.paid).reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f1e6] p-3 sm:p-4 lg:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Buku Kasbon</h1>
          <p className="text-muted-foreground">Catat utang pelanggan</p>
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}. Silakan coba lagi.</p>}

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <p className="text-sm text-orange-700">Total kasbon belum dibayar</p>
            <p className="text-3xl font-bold text-orange-700">Rp {unpaidTotal.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tambah Kasbon Baru</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nama Pelanggan</Label>
                <Input placeholder="Contoh: Pak RT" value={newDebt.customerName}
                  onChange={(e) => setNewDebt({ ...newDebt, customerName: e.target.value })} />
              </div>
              <div>
                <Label>Jumlah (Rp)</Label>
                <Input type="number" placeholder="0" value={newDebt.amount}
                  onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })} />
              </div>
              <div>
                <Label>Catatan (opsional)</Label>
                <Input placeholder="Contoh: Pesanan 3 porsi" value={newDebt.note}
                  onChange={(e) => setNewDebt({ ...newDebt, note: e.target.value })} />
              </div>
            </div>
            <Button onClick={addDebt}>Tambah Kasbon</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Daftar Kasbon</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {debts.map((debt) => (
                <div key={debt.id} className="flex flex-col gap-3 rounded-lg bg-[#f7f1e6] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{debt.customerName}</p>
                      <Badge variant={debt.paid ? "default" : "secondary"}>
                        {debt.paid ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        {debt.paid ? "Lunas" : "Belum Bayar"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(debt.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {debt.note && <p className="text-sm text-muted-foreground mt-1">📝 {debt.note}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-lg font-bold ${debt.paid ? "text-green-600" : "text-orange-600"}`}>
                      Rp {debt.amount.toLocaleString("id-ID")}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => togglePaid(debt.id)}>
                      {debt.paid ? "Batalkan" : "Lunasi"}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteDebt(debt.id)} className="h-8 w-8 text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
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
