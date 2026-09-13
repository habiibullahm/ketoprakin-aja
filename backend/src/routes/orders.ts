import { Hono } from "hono"
import { db } from "../db"
import { orders, orderItems, menuItems, loyaltyStamps, users } from "../db/schema"
import { eq, desc, ne } from "drizzle-orm"
import { z } from "zod"
import { authMiddleware, merchantMiddleware } from "../middleware/auth"
import { getIo } from "../lib/socket"
import { randomBytes } from "node:crypto"
import { verify } from "jsonwebtoken"
import { normalizeIndonesianWhatsAppNumber } from "../lib/phone"
import { getOrderNotifier } from "../lib/notifier"

const orderRoutes = new Hono()

// Validation schema
const orderItemSchema = z.object({
  menuId: z.number(),
  quantity: z.number().min(1),
  spiceLevel: z.number().min(0).max(20).optional(),
  garlicAmount: z.enum(["sedikit", "normal", "banyak"]).optional(),
  sauceConsistency: z.enum(["encer", "pas", "kental"]).optional(),
  toppings: z.array(z.string()).optional(),
})

const createOrderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().optional(),
  orderType: z.enum(["dine-in", "pickup"]),
  paymentMethod: z.enum(["qris", "gopay", "ovo", "dana", "cash"]),
  items: z.array(orderItemSchema).min(1),
  notes: z.string().optional(),
})

const guestOrderSchema = createOrderSchema.omit({ customerPhone: true }).extend({
  whatsappNumber: z.string().min(8),
})

const orderActionSchema = z.object({
  action: z.enum([
    "start_preparing",
    "mark_paid",
    "mark_ready",
    "mark_ready_and_paid",
    "mark_collected",
    "mark_collected_and_paid",
  ]),
})

const createTrackingToken = () => randomBytes(16).toString("base64url").slice(0, 21)

const guestRateLimits = new Map<string, number[]>()
const isRateLimited = (key: string, max: number, windowMs: number) => {
  const cutoff = Date.now() - windowMs
  const recent = (guestRateLimits.get(key) ?? []).filter((timestamp) => timestamp > cutoff)
  if (recent.length >= max) return true
  recent.push(Date.now())
  guestRateLimits.set(key, recent)
  return false
}

const publicOrder = (order: any) => ({
  trackingToken: order.trackingToken,
  trackingUrl: `/track/${order.trackingToken}`,
  orderNumber: order.orderNumber,
  customerName: order.customerName,
  orderType: order.orderType,
  status: order.status,
  totalAmount: order.totalAmount,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  notes: order.notes,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  orderItems: order.orderItems.map((item: any) => ({
    quantity: item.quantity,
    spiceLevel: item.spiceLevel,
    garlicAmount: item.garlicAmount,
    sauceConsistency: item.sauceConsistency,
    toppings: item.toppings,
    price: item.price,
    menuItem: { name: item.menuItem.name, price: item.menuItem.price },
  })),
})

async function optionalCustomer(authHeader?: string) {
  if (!authHeader?.startsWith("Bearer ")) return null
  try {
    const decoded = verify(authHeader.slice(7), process.env.JWT_SECRET!) as { userId: number }
    const user = await db.query.users.findFirst({ where: eq(users.id, decoded.userId) })
    return user?.role === "customer" ? user : null
  } catch {
    return null
  }
}

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
  return `ORD-${timestamp}${random}`
}

// Get all orders (protected)
orderRoutes.get("/", merchantMiddleware, async (c) => {
  try {
    const allOrders = await db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      with: {
        orderItems: {
          with: {
            menuItem: true,
          },
        },
      },
    })
    return c.json(allOrders)
  } catch (error) {
    return c.json({ error: "Failed to fetch orders" }, 500)
  }
})

// Get active orders (protected)
orderRoutes.get("/active", merchantMiddleware, async (c) => {
  try {
    const activeOrders = await db.query.orders.findMany({
      where: ne(orders.status, "selesai"),
      orderBy: [desc(orders.createdAt)],
      with: {
        orderItems: {
          with: {
            menuItem: true,
          },
        },
      },
    })
    return c.json(activeOrders)
  } catch (error) {
    return c.json({ error: "Failed to fetch active orders" }, 500)
  }
})

// Customers need to track their own order without merchant authentication.
orderRoutes.get("/:id", merchantMiddleware, async (c) => {
  try {
    const idParam = c.req.param("id")
    if (!idParam) {
      return c.json({ error: "Invalid ID" }, 400)
    }
    const id = parseInt(idParam)
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        orderItems: {
          with: {
            menuItem: true,
          },
        },
      },
    })

    if (!order) {
      return c.json({ error: "Order not found" }, 404)
    }

    return c.json(order)
  } catch (error) {
    return c.json({ error: "Failed to fetch order" }, 500)
  }
})

// Public tracking uses an unguessable token and returns a deliberately limited DTO.
orderRoutes.get("/track/:trackingToken", async (c) => {
  try {
    const trackingToken = c.req.param("trackingToken")
    const order = await db.query.orders.findFirst({
      where: eq(orders.trackingToken, trackingToken),
      with: { orderItems: { with: { menuItem: true } } },
    })
    if (!order) return c.json({ error: "Tracking link tidak valid" }, 404)
    return c.json(publicOrder(order))
  } catch {
    return c.json({ error: "Tracking link tidak valid" }, 404)
  }
})

// Frictionless checkout. A valid customer token is optional and only adds account history/loyalty.
orderRoutes.post("/guest", async (c) => {
  try {
    const body = await c.req.json()
    const validated = guestOrderSchema.parse(body)
    const customerPhone = normalizeIndonesianWhatsAppNumber(validated.whatsappNumber)
    const forwardedFor = c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
    const clientIp = forwardedFor || c.req.header("x-real-ip") || "unknown"
    if (isRateLimited(`ip:${clientIp}`, 5, 60_000) || isRateLimited(`phone:${customerPhone}`, 10, 3_600_000)) {
      return c.json({ error: "Terlalu banyak pesanan. Silakan coba lagi sebentar." }, 429)
    }

    const customer = await optionalCustomer(c.req.header("Authorization"))
    let totalAmount = 0
    const itemsData: Array<{
      menuId: number
      quantity: number
      spiceLevel: number
      garlicAmount: string
      sauceConsistency: string
      toppings: string | null
      price: string
    }> = []
    for (const item of validated.items) {
      const menuItem = await db.query.menuItems.findFirst({ where: eq(menuItems.id, item.menuId) })
      if (!menuItem || !menuItem.available || menuItem.category === "topping") {
        return c.json({ error: `Menu item ${item.menuId} tidak tersedia` }, 400)
      }
      if (menuItem.category !== "ketoprak" && (item.toppings?.length ?? 0) > 0) {
        return c.json({ error: "Topping hanya dapat ditambahkan ke menu ketoprak" }, 400)
      }
      const price = Number(menuItem.price)
      totalAmount += price * item.quantity
      const toppingNames: string[] = []
      for (const toppingId of item.toppings ?? []) {
        const topping = await db.query.menuItems.findFirst({ where: eq(menuItems.id, Number(toppingId)) })
        if (!topping || topping.category !== "topping" || !topping.available) {
          return c.json({ error: `Topping ${toppingId} tidak tersedia` }, 400)
        }
        toppingNames.push(topping.name)
        totalAmount += Number(topping.price) * item.quantity
      }
      itemsData.push({
        menuId: item.menuId,
        quantity: item.quantity,
        spiceLevel: item.spiceLevel ?? 5,
        garlicAmount: item.garlicAmount ?? "normal",
        sauceConsistency: item.sauceConsistency ?? "pas",
        toppings: toppingNames.length ? JSON.stringify(toppingNames) : null,
        price: price.toString(),
      })
    }

    const trackingToken = createTrackingToken()
    const completeOrder = await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values({
        orderNumber: generateOrderNumber(),
        trackingToken,
        customerName: validated.customerName.trim(),
        customerPhone,
        userId: customer?.id,
        orderType: validated.orderType,
        totalAmount: totalAmount.toString(),
        paymentMethod: validated.paymentMethod,
        paymentStatus: "pending",
        notes: validated.notes,
      }).returning()
      await tx.insert(orderItems).values(itemsData.map((item) => ({ orderId: newOrder.id, ...item })))
      return tx.query.orders.findFirst({
        where: eq(orders.id, newOrder.id),
        with: { orderItems: { with: { menuItem: true } } },
      })
    })
    if (!completeOrder) throw new Error("Order creation failed")

    getIo().to("kitchen").emit("new-order", {
      orderId: completeOrder.id,
      orderNumber: completeOrder.orderNumber,
      customerName: completeOrder.customerName,
      orderType: completeOrder.orderType,
      totalAmount: completeOrder.totalAmount,
      status: completeOrder.status,
    })
    void getOrderNotifier().sendOrderCreated(completeOrder).catch((error) => console.error("Order notification failed", error))
    return c.json(publicOrder(completeOrder), 201)
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: error.issues }, 400)
    if (error instanceof Error && error.message.includes("WhatsApp")) return c.json({ error: error.message }, 400)
    console.error("Guest order error", error instanceof Error ? error.message : String(error))
    return c.json({ error: "Gagal membuat pesanan" }, 500)
  }
})

// Create order
orderRoutes.post("/", authMiddleware, async (c) => {
  try {
    const body = await c.req.json()
    const validated = createOrderSchema.parse(body)
    const user = (c as any).get("user") as { id: number; role: string; name: string }
    if (user.role !== "customer") return c.json({ error: "Customer account required" }, 403)

    // Calculate total and prepare order items
    let totalAmount = 0
    const itemsData = []

    for (const item of validated.items) {
      const menuItem = await db.query.menuItems.findFirst({
        where: eq(menuItems.id, item.menuId),
      })

      if (!menuItem) {
        return c.json({ error: `Menu item ${item.menuId} not found` }, 400)
      }

      const price = parseFloat(menuItem.price)
      const itemTotal = price * item.quantity
      totalAmount += itemTotal

      itemsData.push({
        menuId: item.menuId,
        quantity: item.quantity,
        spiceLevel: item.spiceLevel ?? 5,
        garlicAmount: item.garlicAmount || "normal",
        sauceConsistency: item.sauceConsistency || "pas",
        toppings: item.toppings ? JSON.stringify(item.toppings) : null,
        price: price.toString(),
      })
    }

    // Create order
    const orderNumber = generateOrderNumber()
    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        trackingToken: createTrackingToken(),
        customerName: validated.customerName,
        userId: user.id,
        customerPhone: validated.customerPhone,
        orderType: validated.orderType,
        totalAmount: totalAmount.toString(),
        paymentMethod: validated.paymentMethod,
        paymentStatus: "pending",
        notes: validated.notes,
      })
      .returning()

    // Create order items
    for (const item of itemsData) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        ...item,
      })
    }

    // Emit socket event for real-time KDS update
    const io = getIo()
    io.to("kitchen").emit("new-order", {
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      customerName: newOrder.customerName,
      orderType: newOrder.orderType,
      totalAmount: newOrder.totalAmount,
      status: newOrder.status,
    })

    // Fetch complete order with items
    const completeOrder = await db.query.orders.findFirst({
      where: eq(orders.id, newOrder.id),
      with: {
        orderItems: {
          with: {
            menuItem: true,
          },
        },
      },
    })

    return c.json(completeOrder, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues }, 400)
    }
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error("Create order error:", errMsg)
    return c.json({ error: "Failed to create order", details: errMsg }, 500)
  }
})

// One-tap merchant actions keep kitchen status, payment, and loyalty atomic.
orderRoutes.patch("/:id/action", merchantMiddleware, async (c) => {
  try {
    const id = Number(c.req.param("id"))
    if (!Number.isInteger(id) || id <= 0) return c.json({ error: "Invalid ID" }, 400)
    const { action } = orderActionSchema.parse(await c.req.json())

    const result = await db.transaction(async (tx) => {
      const current = await tx.query.orders.findFirst({ where: eq(orders.id, id) })
      if (!current) return null

      const alreadyApplied =
        (action === "start_preparing" && current.status === "nguleg") ||
        (action === "mark_paid" && current.paymentStatus === "paid") ||
        (action === "mark_ready" && current.status === "siap-diambil") ||
        (action === "mark_ready_and_paid" && current.status === "siap-diambil" && current.paymentStatus === "paid") ||
        (action === "mark_collected" && current.status === "selesai") ||
        (action === "mark_collected_and_paid" && current.status === "selesai" && current.paymentStatus === "paid")
      if (alreadyApplied) return { order: current, changed: false }

      const transitions: Record<string, { from: string[]; status?: string; paid?: boolean }> = {
        start_preparing: { from: ["menunggu"], status: "nguleg" },
        mark_paid: { from: ["menunggu", "nguleg", "siap-diambil"], paid: true },
        mark_ready: { from: ["nguleg"], status: "siap-diambil" },
        mark_ready_and_paid: { from: ["nguleg"], status: "siap-diambil", paid: true },
        mark_collected: { from: ["siap-diambil"], status: "selesai" },
        mark_collected_and_paid: { from: ["siap-diambil"], status: "selesai", paid: true },
      }
      const transition = transitions[action]
      if (!transition.from.includes(current.status)) throw new Error("INVALID_TRANSITION")

      const [order] = await tx.update(orders).set({
        status: transition.status ?? current.status,
        paymentStatus: transition.paid ? "paid" : current.paymentStatus,
        updatedAt: new Date(),
      }).where(eq(orders.id, id)).returning()

      if (transition.paid && order.userId) {
        await tx.insert(loyaltyStamps).values({ userId: order.userId, orderId: order.id }).onConflictDoNothing()
      }
      return { order, changed: true }
    })

    if (!result) return c.json({ error: "Order not found" }, 404)
    const updated = result.order
    const statusUpdate = {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
    }
    const io = getIo()
    if (result.changed) {
      io.to("kitchen").emit("order-status-update", statusUpdate)
      io.to(`track:${updated.trackingToken}`).emit("order-status-update", statusUpdate)
    }
    if (result.changed && (action === "mark_ready" || action === "mark_ready_and_paid")) {
      void getOrderNotifier().sendOrderReady(updated).catch((error) => console.error("Ready notification failed", error))
    }
    return c.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: error.issues }, 400)
    if (error instanceof Error && error.message === "INVALID_TRANSITION") {
      return c.json({ error: "Perubahan status tidak valid" }, 409)
    }
    return c.json({ error: "Failed to update order" }, 500)
  }
})

// Update order status (protected)
orderRoutes.patch("/:id/status", merchantMiddleware, async (c) => {
  try {
    const idParam = c.req.param("id")
    if (!idParam) {
      return c.json({ error: "Invalid ID" }, 400)
    }
    const id = parseInt(idParam)
    const { status } = await c.req.json()

    const validStatuses = ["menunggu", "nguleg", "siap-diambil", "selesai"]
    if (!validStatuses.includes(status)) {
      return c.json({ error: "Invalid status" }, 400)
    }

    const [updated] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()

    if (!updated) {
      return c.json({ error: "Order not found" }, 404)
    }

    // Emit socket event for real-time KDS update
    const io = getIo()
    const statusUpdate = {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    }
    io.to("kitchen").emit("order-status-update", statusUpdate)
    io.to(`track:${updated.trackingToken}`).emit("order-status-update", statusUpdate)

    return c.json(updated)
  } catch (error) {
    return c.json({ error: "Failed to update order status" }, 500)
  }
})

// Update payment status (protected)
orderRoutes.patch("/:id/payment", merchantMiddleware, async (c) => {
  try {
    const idParam = c.req.param("id")
    if (!idParam) {
      return c.json({ error: "Invalid ID" }, 400)
    }
    const id = parseInt(idParam)
    const { paymentStatus } = await c.req.json()

    const validStatuses = ["pending", "paid", "failed"]
    if (!validStatuses.includes(paymentStatus)) {
      return c.json({ error: "Invalid payment status" }, 400)
    }

    const [updated] = await db
      .update(orders)
      .set({
        paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()

    if (!updated) {
      return c.json({ error: "Order not found" }, 404)
    }

    if (updated.paymentStatus === "paid" && updated.userId) {
      await db.insert(loyaltyStamps).values({ userId: updated.userId, orderId: updated.id }).onConflictDoNothing()
    }

    return c.json(updated)
  } catch (error) {
    return c.json({ error: "Failed to update payment status" }, 500)
  }
})

export { orderRoutes }
