import { Context, Next } from "hono"
import { verify } from "jsonwebtoken"
import { db } from "../db"
import { users } from "../db/schema"
import { eq } from "drizzle-orm"

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const token = authHeader.substring(7)

  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: number }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    })

    if (!user) {
      return c.json({ error: "User not found" }, 401)
    }

    c.set("user", user)
    await next()
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401)
  }
}
