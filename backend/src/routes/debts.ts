import { Hono } from "hono"
import { db } from "../db"
import { debts } from "../db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"
import { authMiddleware } from "../middleware/auth"

const debtRoutes = new Hono()

// Validation schema
const debtSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().optional(),
  amount: z.string().or(z.number()),
  note: z.string().optional(),
})

// Get all debts (protected)
debtRoutes.get("/", authMiddleware, async (c) => {
  try {
    const allDebts = await db.query.debts.findMany({
      orderBy: [desc(debts.createdAt)],
    })
    return c.json(allDebts)
  } catch (error) {
    return c.json({ error: "Failed to fetch debts" }, 500)
  }
})

// Get unpaid debts (protected)
debtRoutes.get("/unpaid", authMiddleware, async (c) => {
  try {
    const unpaidDebts = await db.query.debts.findMany({
      where: eq(debts.paid, false),
      orderBy: [desc(debts.createdAt)],
    })
    return c.json(unpaidDebts)
  } catch (error) {
    return c.json({ error: "Failed to fetch unpaid debts" }, 500)
  }
})

// Get paid debts (protected)
debtRoutes.get("/paid", authMiddleware, async (c) => {
  try {
    const paidDebts = await db.query.debts.findMany({
      where: eq(debts.paid, true),
      orderBy: [desc(debts.paidAt)],
    })
    return c.json(paidDebts)
  } catch (error) {
    return c.json({ error: "Failed to fetch paid debts" }, 500)
  }
})

// Get single debt (protected)
debtRoutes.get("/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id")!)
    const debt = await db.query.debts.findFirst({
      where: eq(debts.id, id),
    })

    if (!debt) {
      return c.json({ error: "Debt not found" }, 404)
    }

    return c.json(debt)
  } catch (error) {
    return c.json({ error: "Failed to fetch debt" }, 500)
  }
})

// Create debt (protected)
debtRoutes.post("/", authMiddleware, async (c) => {
  try {
    const body = await c.req.json()
    const validated = debtSchema.parse(body)

    const [newDebt] = await db
      .insert(debts)
      .values({
        ...validated,
        amount: validated.amount.toString(),
      })
      .returning()

    return c.json(newDebt, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues }, 400)
    }
    return c.json({ error: "Failed to create debt" }, 500)
  }
})

// Mark debt as paid (protected)
debtRoutes.patch("/:id/pay", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id")!)
    
    const debt = await db.query.debts.findFirst({
      where: eq(debts.id, id),
    })

    if (!debt) {
      return c.json({ error: "Debt not found" }, 404)
    }

    if (debt.paid) {
      return c.json({ error: "Debt already paid" }, 400)
    }

    const [updated] = await db
      .update(debts)
      .set({
        paid: true,
        paidAt: new Date(),
      })
      .where(eq(debts.id, id))
      .returning()

    return c.json(updated)
  } catch (error) {
    return c.json({ error: "Failed to mark debt as paid" }, 500)
  }
})

// Mark debt as unpaid (protected)
debtRoutes.patch("/:id/unpay", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id")!)
    
    const debt = await db.query.debts.findFirst({
      where: eq(debts.id, id),
    })

    if (!debt) {
      return c.json({ error: "Debt not found" }, 404)
    }

    if (!debt.paid) {
      return c.json({ error: "Debt already unpaid" }, 400)
    }

    const [updated] = await db
      .update(debts)
      .set({
        paid: false,
        paidAt: null,
      })
      .where(eq(debts.id, id))
      .returning()

    return c.json(updated)
  } catch (error) {
    return c.json({ error: "Failed to mark debt as unpaid" }, 500)
  }
})

// Update debt (protected)
debtRoutes.put("/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id")!)
    const body = await c.req.json()
    const validated = debtSchema.partial().parse(body)

    const [updated] = await db
      .update(debts)
      .set({
        ...validated,
        amount: validated.amount?.toString(),
      })
      .where(eq(debts.id, id))
      .returning()

    if (!updated) {
      return c.json({ error: "Debt not found" }, 404)
    }

    return c.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues }, 400)
    }
    return c.json({ error: "Failed to update debt" }, 500)
  }
})

// Delete debt (protected)
debtRoutes.delete("/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id")!)
    
    const [deleted] = await db
      .delete(debts)
      .where(eq(debts.id, id))
      .returning()

    if (!deleted) {
      return c.json({ error: "Debt not found" }, 404)
    }

    return c.json({ message: "Debt deleted" })
  } catch (error) {
    return c.json({ error: "Failed to delete debt" }, 500)
  }
})

// Get debt summary (protected)
debtRoutes.get("/summary/total", authMiddleware, async (c) => {
  try {
    const unpaidDebts = await db.query.debts.findMany({
      where: eq(debts.paid, false),
    })

    const totalUnpaid = unpaidDebts.reduce((sum, debt) => {
      return sum + parseFloat(debt.amount)
    }, 0)

    return c.json({
      totalUnpaid,
      count: unpaidDebts.length,
    })
  } catch (error) {
    return c.json({ error: "Failed to fetch summary" }, 500)
  }
})

export { debtRoutes }
