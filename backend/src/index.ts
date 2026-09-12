import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { authRoutes } from "./routes/auth"
import { menuRoutes } from "./routes/menu"
import { orderRoutes } from "./routes/orders"
import { expenseRoutes } from "./routes/expenses"
import { debtRoutes } from "./routes/debts"
import { customerRoutes } from "./routes/customer"
import { setIo } from "./lib/socket"
import { cors } from "hono/cors"

const app = new Hono()

app.use("/api/*", cors({
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}))

app.route("/api/auth", authRoutes)
app.route("/api/menu", menuRoutes)
app.route("/api/orders", orderRoutes)
app.route("/api/expenses", expenseRoutes)
app.route("/api/debts", debtRoutes)
app.route("/api/customer", customerRoutes)

app.get("/health", (c) => c.json({ status: "ok" }))

const server = serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`)
  }
)

setIo(server)
