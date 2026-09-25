import { Context, Next } from "hono"
import { verify } from "jsonwebtoken"
import { db } from "../db"
import { users } from "../db/schema"
import { eq } from "drizzle-orm"
import { jwtSecret } from "../config"

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const token = authHeader.substring(7)

  try {
    const decoded = verify(token, jwtSecret) as unknown as { userId: number }
    
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

export const merchantMiddleware = async (c: Context, next: Next) => {
  return authMiddleware(c, (async () => {
    const user = (c as any).get("user") as { role: string }
    if (user.role !== "merchant") {
      return c.json({ error: "Merchant access required" }, 403)
    }
    return next()
  }) as Next)
}

