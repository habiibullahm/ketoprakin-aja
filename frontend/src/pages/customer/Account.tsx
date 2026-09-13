import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { authApi, customerApi } from "@/lib/api"

export function CustomerAccount() {
  const [name, setName] = useState("")
  const [orders, setOrders] = useState<any[]>([])
  const [stamps, setStamps] = useState({ stamps: 0, remaining: 10, rewardAvailable: false })
  const navigate = useNavigate()
  useEffect(() => { Promise.all([authApi.me(), customerApi.orders(), customerApi.loyalty()]).then(([user, history, loyalty]) => { if (user.role !== "customer") throw new Error(); setName(user.name); setOrders(history); setStamps(loyalty) }).catch(() => navigate("/customer/login")) }, [navigate])
  return <main className="min-h-screen bg-gray-50 p-4"><div className="mx-auto max-w-md space-y-4"><Link className="text-sm text-primary" to="/">← Kembali ke menu</Link><h1 className="text-2xl font-bold">Akun {name}</h1><section className="rounded-lg bg-primary p-5 text-primary-foreground"><p>Stempel loyalitas</p><p className="text-3xl font-bold">{stamps.stamps} / 10</p><p className="text-sm">{stamps.rewardAvailable ? "Gratis 1 porsi tersedia!" : `${stamps.remaining} pesanan lagi untuk gratis 1 porsi.`}</p></section><section className="rounded-lg bg-white p-4 shadow"><h2 className="font-semibold">Riwayat Pesanan</h2>{orders.length ? orders.map((order) => <Link className="mt-3 block rounded border p-3" key={order.id} to={`/track/${order.trackingToken}`}><b>{order.orderNumber}</b><span className="float-right">{order.status}</span><p className="text-sm text-muted-foreground">Rp {Number(order.totalAmount).toLocaleString("id-ID")}</p></Link>) : <p className="mt-3 text-sm text-muted-foreground">Belum ada pesanan.</p>}</section></div></main>
}
