import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { authApi } from "@/lib/api"

export function CustomerLogin() {
  const [searchParams] = useSearchParams()
  const [isRegistering, setIsRegistering] = useState(searchParams.get("mode") === "register")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const result = isRegistering ? await authApi.register(email, password, name) : await authApi.login(email, password)
      if (result.user.role !== "customer") {
        authApi.logout()
        throw new Error("Gunakan halaman login merchant untuk akun admin.")
      }
      navigate("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal")
    }
  }

  return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <form className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow" onSubmit={submit}>
      <div className="text-center"><h1 className="text-2xl font-bold">{isRegistering ? "Daftar Pelanggan" : "Login Pelanggan"}</h1><p className="text-sm text-muted-foreground">Simpan riwayat pesanan dan kumpulkan stempel.</p></div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {isRegistering && <input className="w-full rounded border p-2" placeholder="Nama" required value={name} onChange={(e) => setName(e.target.value)} />}
      <input className="w-full rounded border p-2" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full rounded border p-2" type="password" minLength={6} placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="w-full rounded bg-primary p-2 font-medium text-primary-foreground" type="submit">{isRegistering ? "Daftar" : "Login"}</button>
      <button className="w-full text-sm text-primary" type="button" onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? "Sudah punya akun? Login" : "Belum punya akun? Daftar"}</button>
    </form>
  </div>
}
