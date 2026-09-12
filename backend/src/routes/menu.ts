import { Hono } from "hono"
import { db } from "../db"
import { menuItems } from "../db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { merchantMiddleware as authMiddleware } from "../middleware/auth"

const menuRoutes = new Hono()

// Validation schema
const menuItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.string().or(z.number()),
  category: z.enum(["ketoprak", "topping", "minuman"]),
  image: z.string().optional(),
  available: z.boolean().optional(),
})

// Get all menu items
menuRoutes.get("/", async (c) => {
  try {
    const items = await db.query.menuItems.findMany()
    return c.json(items)
  } catch (error) {
    return c.json({ error: "Failed to fetch menu" }, 500)
  }
})

// Get available menu items only
menuRoutes.get("/available", async (c) => {
  try {
    const items = await db.query.menuItems.findMany({
      where: eq(menuItems.available, true),
    })
    return c.json(items)
  } catch (error) {
    return c.json({ error: "Failed to fetch menu" }, 500)
  }
})

// Get single menu item
menuRoutes.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id")!)
    const item = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, id),
    })

    if (!item) {
      return c.json({ error: "Menu item not found" }, 404)
    }

    return c.json(item)
  } catch (error) {
    return c.json({ error: "Failed to fetch menu item" }, 500)
  }
})

// Create menu item (protected)
menuRoutes.post("/", authMiddleware, async (c) => {
  try {
    const body = await c.req.json()
    const validated = menuItemSchema.parse(body)

    const [newItem] = await db
      .insert(menuItems)
      .values({
        ...validated,
        price: validated.price.toString(),
      })
      .returning()

    return c.json(newItem, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues }, 400)
    }
    return c.json({ error: "Failed to create menu item" }, 500)
  }
})

// Update menu item (protected)
menuRoutes.put("/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id")!)
    const body = await c.req.json()
    const validated = menuItemSchema.partial().parse(body)

    const [updated] = await db
      .update(menuItems)
      .set({
        ...validated,
        price: validated.price?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, id))
      .returning()

    if (!updated) {
      return c.json({ error: "Menu item not found" }, 404)
    }

    return c.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues }, 400)
    }
    return c.json({ error: "Failed to update menu item" }, 500)
  }
})

// Toggle availability (protected)
menuRoutes.patch("/:id/toggle", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id")!)
    
    const item = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, id),
    })

    if (!item) {
      return c.json({ error: "Menu item not found" }, 404)
    }

    const [updated] = await db
      .update(menuItems)
      .set({
        available: !item.available,
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, id))
      .returning()

    return c.json(updated)
  } catch (error) {
    return c.json({ error: "Failed to toggle availability" }, 500)
  }
})

// Delete menu item (protected)
menuRoutes.delete("/:id", authMiddleware, async (c) => {
  try {
    const idParam = c.req.param("id")
    if (!idParam) {
      return c.json({ error: "Invalid ID" }, 400)
    }
    const id = parseInt(idParam)
    
    const [deleted] = await db
      .delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning()

    if (!deleted) {
      return c.json({ error: "Menu item not found" }, 404)
    }

    return c.json({ message: "Menu item deleted" })
  } catch (error) {
    return c.json({ error: "Failed to delete menu item" }, 500)
  }
})

export { menuRoutes }
