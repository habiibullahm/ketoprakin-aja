import { db } from "./db"
import { menuItems, users } from "./db/schema"
import { hash } from "bcryptjs"

async function seed() {
  console.log("🌱 Seeding database...")

  // Create default merchant user
  const hashedPassword = await hash("password123", 10)
  
  try {
    const [merchant] = await db
      .insert(users)
      .values({
        email: "masedo@ketoprakin.com",
        password: hashedPassword,
        name: "Mas Edo",
        role: "merchant",
      })
      .returning()
    
    console.log("✓ Created merchant:", merchant.email)
  } catch (error) {
    console.log("⚠ Merchant already exists or error:", error)
  }

  // Seed menu items
  const menuData = [
    {
      name: "Ketoprak Original",
      description: "Lontong, tahu, tauge, bihun, bumbu kacang ulek manual",
      price: "15000",
      category: "ketoprak",
      image: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop",
      available: true,
    },
    {
      name: "Ketoprak Telur",
      description: "Ketoprak original + telur rebus",
      price: "18000",
      category: "ketoprak",
      image: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop",
      available: true,
    },
    {
      name: "Ketoprak Spesial",
      description: "Ketoprak original + telur + sate tahu + kerupuk ekstra",
      price: "25000",
      category: "ketoprak",
      image: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop",
      available: true,
    },
    {
      name: "Extra Tahu",
      description: "Tahu goreng tambahan",
      price: "3000",
      category: "topping",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
      available: true,
    },
    {
      name: "Extra Kerupuk",
      description: "Kerupuk kanji tambahan",
      price: "2000",
      category: "topping",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
      available: true,
    },
    {
      name: "Es Teh Manis",
      description: "Teh manis dingin segar",
      price: "5000",
      category: "minuman",
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
      available: true,
    },
    {
      name: "Es Jeruk",
      description: "Jeruk peras segar",
      price: "7000",
      category: "minuman",
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
      available: true,
    },
  ]

  for (const item of menuData) {
    try {
      await db.insert(menuItems).values(item)
      console.log("✓ Added menu item:", item.name)
    } catch (error) {
      console.log("⚠ Menu item exists or error:", item.name)
    }
  }

  console.log("✅ Seeding complete!")
  process.exit(0)
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error)
  process.exit(1)
})
