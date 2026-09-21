import { Hono } from "hono"
import { and, eq, gte, lt, ne } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db"
import { expenses, menuItems, orders } from "../db/schema"
import { merchantMiddleware } from "../middleware/auth"

const merchantRoutes = new Hono()
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD").superRefine((value, context) => {
  const [year, month, day] = value.split("-").map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid calendar date" })
})

const getDayRange = (dateValue: string) => {
  const date = new Date(dateValue + "T00:00:00")
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_DATE")
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)
  return { start: date, end: nextDay }
}

const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return { start, end }
}

const sumAmounts = (rows: Array<{ totalAmount?: string; amount?: string }>) =>
  rows.reduce((sum, row) => sum + Number(row.totalAmount ?? row.amount ?? 0), 0)

merchantRoutes.get("/dashboard", merchantMiddleware, async (c) => {
  const requestedDate = c.req.query("date") ?? new Date().toISOString().slice(0, 10)
  const parsedDate = dateSchema.safeParse(requestedDate)
  if (!parsedDate.success) return c.json({ error: parsedDate.error.issues }, 400)

  try {
    const day = getDayRange(requestedDate)
    const month = getMonthRange(day.start)
    const [activeOrders, todayPaidOrders, monthPaidOrders, todayExpenses, monthExpenses, menu] = await Promise.all([
      db.query.orders.findMany({ where: ne(orders.status, "selesai") }),
      db.query.orders.findMany({ where: and(gte(orders.createdAt, day.start), lt(orders.createdAt, day.end), eq(orders.paymentStatus, "paid")) }),
      db.query.orders.findMany({ where: and(gte(orders.createdAt, month.start), lt(orders.createdAt, month.end), eq(orders.paymentStatus, "paid")) }),
      db.query.expenses.findMany({ where: and(gte(expenses.date, day.start), lt(expenses.date, day.end)) }),
      db.query.expenses.findMany({ where: and(gte(expenses.date, month.start), lt(expenses.date, month.end)) }),
      db.query.menuItems.findMany(),
    ])

    const todayRevenue = sumAmounts(todayPaidOrders)
    const todayExpensesTotal = sumAmounts(todayExpenses)
    const monthRevenue = sumAmounts(monthPaidOrders)
    const monthExpensesTotal = sumAmounts(monthExpenses)

    return c.json({
      date: requestedDate,
      activeOrders: activeOrders.length,
      todayRevenue,
      todayExpenses: todayExpensesTotal,
      todayProfit: todayRevenue - todayExpensesTotal,
      monthRevenue,
      monthExpenses: monthExpensesTotal,
      monthProfit: monthRevenue - monthExpensesTotal,
      paidOrderCount: monthPaidOrders.length,
      pendingPaymentCount: activeOrders.filter((order) => order.paymentStatus === "pending").length,
      availableMenuCount: menu.filter((item) => item.available).length,
      unavailableMenuCount: menu.filter((item) => !item.available).length,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_DATE") return c.json({ error: "Invalid date" }, 400)
    return c.json({ error: "Failed to fetch merchant dashboard" }, 500)
  }
})

export { merchantRoutes }
