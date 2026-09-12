import { Hono } from "hono"
import { db } from "../db"
import { orders, orderItems, menuItems, loyaltyStamps } from "../db/schema"
import { eq, desc, ne } from "drizzle-orm"
import { z } from "zod"
import { authMiddleware, merchantMiddleware } from "../middleware/auth"
import { getIo } from "../lib/socket"

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
orderRoutes.get("/:id", async (c) => {
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
        spiceLevel: item.spiceLevel || 5,
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
    io.to(`order:${updated.id}`).emit("order-status-update", statusUpdate)

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
