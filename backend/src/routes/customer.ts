import { Hono } from "hono"
import { desc, eq } from "drizzle-orm"
import { db } from "../db"
import { loyaltyStamps, orders } from "../db/schema"
import { authMiddleware } from "../middleware/auth"

const customerRoutes = new Hono()
customerRoutes.use("*", authMiddleware)

customerRoutes.use("*", async (c, next) => {
  const user = (c as any).get("user") as { role: string }
  if (user.role !== "customer") return c.json({ error: "Customer access required" }, 403)
  await next()
})

customerRoutes.get("/orders", async (c) => {
  const user = (c as any).get("user") as { id: number }
  const customerOrders = await db.query.orders.findMany({
    where: eq(orders.userId, user.id),
    orderBy: [desc(orders.createdAt)],
    with: { orderItems: { with: { menuItem: true } } },
  })
  return c.json(customerOrders)
})

customerRoutes.get("/loyalty", async (c) => {
  const user = (c as any).get("user") as { id: number }
  const stamps = await db.query.loyaltyStamps.findMany({ where: eq(loyaltyStamps.userId, user.id) })
  return c.json({ stamps: stamps.length, rewardAvailable: stamps.length >= 10, remaining: Math.max(0, 10 - stamps.length) })
})

export { customerRoutes }
