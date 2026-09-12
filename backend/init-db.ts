import { db } from './src/db/index';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function initDatabase() {
  console.log('Initializing database...');
  
  try {
    // Test connection
    await db.execute(sql`SELECT 1`);
    console.log('✓ Database connection successful');
    
    // Push schema
    console.log('Pushing schema...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'merchant',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        image TEXT,
        available BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        user_id INTEGER REFERENCES users(id),
        order_type VARCHAR(20) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'menunggu',
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS loyalty_stamps (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        menu_id INTEGER REFERENCES menu_items(id),
        quantity INTEGER NOT NULL,
        spice_level INTEGER NOT NULL DEFAULT 5,
        garlic_amount VARCHAR(20) NOT NULL DEFAULT 'normal',
        sauce_consistency VARCHAR(20) NOT NULL DEFAULT 'pas',
        toppings TEXT,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS debts (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        amount DECIMAL(10,2) NOT NULL,
        paid BOOLEAN NOT NULL DEFAULT false,
        note TEXT,
        paid_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('✓ Schema pushed successfully');
    
    // Seed default merchant
    const merchantExists = await db.execute(sql`
      SELECT COUNT(*) as count FROM users WHERE email = 'masedo@ketoprakin.com'
    `);
    
    if (merchantExists[0].count === '0') {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await db.execute(sql`
        INSERT INTO users (email, password, name, role)
        VALUES ('masedo@ketoprakin.com', ${hashedPassword}, 'Mas Edo', 'merchant')
      `);
      console.log('✓ Default merchant created');
    }
    
    // Seed menu items
    const menuCount = await db.execute(sql`SELECT COUNT(*) as count FROM menu_items`);
    if (menuCount[0].count === '0') {
      await db.execute(sql`
        INSERT INTO menu_items (name, description, price, category, image, available) VALUES
        ('Ketoprak Original', 'Lontong, tahu, tauge, bihun, bumbu kacang ulek manual', 15000, 'ketoprak', 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop', true),
        ('Ketoprak Telur', 'Ketoprak original + telur rebus', 18000, 'ketoprak', 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop', true),
        ('Ketoprak Spesial', 'Ketoprak original + telur + sate tahu + kerupuk ekstra', 25000, 'ketoprak', 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop', true),
        ('Extra Tahu', 'Tahu goreng tambahan', 3000, 'topping', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', true),
        ('Extra Kerupuk', 'Kerupuk kanji tambahan', 2000, 'topping', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', true),
        ('Es Teh Manis', 'Teh manis dingin segar', 5000, 'minuman', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', true),
        ('Es Jeruk', 'Jeruk peras segar', 7000, 'minuman', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', true)
      `);
      console.log('✓ Menu items seeded');
    }
    
    console.log('✓ Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
