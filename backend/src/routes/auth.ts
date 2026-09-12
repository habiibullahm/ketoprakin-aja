import { Hono } from "hono"
import { sign } from "jsonwebtoken"
import { hash, compare } from "bcryptjs"
import { db } from "../db"
import { users } from "../db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const authRoutes = new Hono()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// Register new merchant
authRoutes.post("/register", async (c) => {
  try {
    const body = await c.req.json()
    const validated = registerSchema.parse(body)

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validated.email),
    })

    if (existingUser) {
      return c.json({ error: "Email already registered" }, 400)
    }

    // Hash password
    const hashedPassword = await hash(validated.password, 10)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validated.email,
        password: hashedPassword,
        name: validated.name,
        role: "merchant",
      })
      .returning()

    // Generate token
    const token = sign(
      { userId: newUser.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    )

    return c.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues }, 400)
    }
    return c.json({ error: "Registration failed" }, 500)
  }
})

// Login
authRoutes.post("/login", async (c) => {
  try {
    const body = await c.req.json()
    const validated = loginSchema.parse(body)

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, validated.email),
    })

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401)
    }

    // Verify password
    const isValid = await compare(validated.password, user.password)
    if (!isValid) {
      return c.json({ error: "Invalid credentials" }, 401)
    }

    // Generate token
    const token = sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    )

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues }, 400)
    }
    return c.json({ error: "Login failed" }, 500)
  }
})

// Get current user
authRoutes.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  try {
    const { verify } = await import("jsonwebtoken")
    const token = authHeader.substring(7)
    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: number }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    })

    if (!user) {
      return c.json({ error: "User not found" }, 404)
    }

    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401)
  }
})

export { authRoutes }
