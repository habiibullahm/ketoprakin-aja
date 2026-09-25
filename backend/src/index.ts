import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { authRoutes } from "./routes/auth"
import { menuRoutes } from "./routes/menu"
import { orderRoutes } from "./routes/orders"
import { expenseRoutes } from "./routes/expenses"
import { debtRoutes } from "./routes/debts"
import { customerRoutes } from "./routes/customer"
import { merchantRoutes } from "./routes/merchant"
import { setIo } from "./lib/socket"
import { cors } from "hono/cors"
import { sql } from "drizzle-orm"
import { db } from "./db"
import "./config"

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
app.route("/api/merchant", merchantRoutes)

app.get("/health", (c) => c.json({ status: "ok" }))

app.get("/ready", async (c) => {
  try {
    await db.execute(sql`SELECT 1`)
    return c.json({ status: "ready" })
  } catch {
    return c.json({ status: "not_ready" }, 503)
  }
})

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

