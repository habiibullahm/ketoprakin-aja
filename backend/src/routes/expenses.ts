import { Hono } from "hono"
import { db } from "../db"
import { expenses } from "../db/schema"
import { eq, desc, and, gte, lte } from "drizzle-orm"
import { z } from "zod"
import { merchantMiddleware as authMiddleware } from "../middleware/auth"

const expenseRoutes = new Hono()

// Validation schema
const expenseSchema = z.object({
  category: z.enum(["bahan-baku", "gas", "plastik", "lainnya"]),
  description: z.string().min(2),
  amount: z.string().or(z.number()),
  date: z.string().optional(),
})

// Get all expenses (protected)
expenseRoutes.get("/", authMiddleware, async (c) => {
  try {
    const allExpenses = await db.query.expenses.findMany({
      orderBy: [desc(expenses.date)],
    })
    return c.json(allExpenses)
  } catch (error) {
    return c.json({ error: "Failed to fetch expenses" }, 500)
  }
})

// Get expenses by date range (protected)
expenseRoutes.get("/range", authMiddleware, async (c) => {
  try {
    const startDate = c.req.query("start")
    const endDate = c.req.query("end")

    if (!startDate || !endDate) {
      return c.json({ error: "Start and end dates are required" }, 400)
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const filteredExpenses = await db.query.expenses.findMany({
      where: and(
        gte(expenses.date, start),
        lte(expenses.date, end)
      ),
      orderBy: [desc(expenses.date)],
    })

    return c.json(filteredExpenses)
  } catch (error) {
    return c.json({ error: "Failed to fetch expenses" }, 500)
  }
})

// Get today's expenses (protected)
expenseRoutes.get("/today", authMiddleware, async (c) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayExpenses = await db.query.expenses.findMany({
      where: and(
        gte(expenses.date, today),
        lte(expenses.date, tomorrow)
      ),
      orderBy: [desc(expenses.date)],
    })

    return c.json(todayExpenses)
  } catch (error) {
    return c.json({ error: "Failed to fetch today's expenses" }, 500)
  }
})

// Get single expense (protected)
expenseRoutes.get("/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id")!)
    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, id),
    })

    if (!expense) {
      return c.json({ error: "Expense not found" }, 404)
    }

    return c.json(expense)
  } catch (error) {
    return c.json({ error: "Failed to fetch expense" }, 500)
  }
})

// Create expense (protected)
expenseRoutes.post("/", authMiddleware, async (c) => {
  try {
    const body = await c.req.json()
    const validated = expenseSchema.parse(body)

    const [newExpense] = await db
      .insert(expenses)
      .values({
        ...validated,
        amount: validated.amount.toString(),
        date: validated.date ? new Date(validated.date) : new Date(),
      })
      .returning()

    return c.json(newExpense, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues }, 400)
    }
    return c.json({ error: "Failed to create expense" }, 500)
  }
})

// Update expense (protected)
expenseRoutes.put("/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id")!)
    const body = await c.req.json()
    const validated = expenseSchema.partial().parse(body)

    const [updated] = await db
      .update(expenses)
      .set({
        ...validated,
        amount: validated.amount?.toString(),
        date: validated.date ? new Date(validated.date) : undefined,
      })
      .where(eq(expenses.id, id))
      .returning()

    if (!updated) {
      return c.json({ error: "Expense not found" }, 404)
    }

    return c.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues }, 400)
    }
    return c.json({ error: "Failed to update expense" }, 500)
  }
})

// Delete expense (protected)
expenseRoutes.delete("/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id")!)
    
    const [deleted] = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning()

    if (!deleted) {
      return c.json({ error: "Expense not found" }, 404)
    }

    return c.json({ message: "Expense deleted" })
  } catch (error) {
    return c.json({ error: "Failed to delete expense" }, 500)
  }
})

// Get expense summary (protected)
expenseRoutes.get("/summary/range", authMiddleware, async (c) => {
  try {
    const startDate = c.req.query("start")
    const endDate = c.req.query("end")

    if (!startDate || !endDate) {
      return c.json({ error: "Start and end dates are required" }, 400)
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const filteredExpenses = await db.query.expenses.findMany({
      where: and(
        gte(expenses.date, start),
        lte(expenses.date, end)
      ),
    })

    const total = filteredExpenses.reduce((sum, exp) => {
      return sum + parseFloat(exp.amount)
    }, 0)

    const byCategory = filteredExpenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = 0
      }
      acc[exp.category] += parseFloat(exp.amount)
      return acc
    }, {} as Record<string, number>)

    return c.json({
      total,
      byCategory,
      count: filteredExpenses.length,
    })
  } catch (error) {
    return c.json({ error: "Failed to fetch summary" }, 500)
  }
})

export { expenseRoutes }
