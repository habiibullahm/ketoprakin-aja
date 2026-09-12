import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

/**
 * Redirects to /merchant/login if no auth token is found in localStorage.
 * Call this at the top of every merchant-protected page component.
 */
export function useAuthGuard() {
  const navigate = useNavigate()
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      navigate("/merchant/login", { replace: true })
    }
  }, [navigate])
}
