const { db } = require('./src/db/index');
const { sql } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

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
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        low_stock_threshold INTEGER NOT NULL DEFAULT 5,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'menu_items'
            AND column_name = 'stock_quantity'
        ) THEN
          ALTER TABLE menu_items ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0;
          UPDATE menu_items
          SET stock_quantity = CASE category
            WHEN 'ketoprak' THEN 30
            WHEN 'minuman' THEN 20
            WHEN 'topping' THEN 50
            ELSE 0
          END;
        END IF;
      END
      $$;
    `);
    await db.execute(sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5`);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
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
      const initialPassword = process.env.MERCHANT_INITIAL_PASSWORD;
      if (!initialPassword || initialPassword.length < 12) {
        throw new Error('MERCHANT_INITIAL_PASSWORD must be set and contain at least 12 characters');
      }
      const hashedPassword = await bcrypt.hash(initialPassword, 10);
      
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
        INSERT INTO menu_items (name, description, price, category, image, available, stock_quantity, low_stock_threshold) VALUES
        ('Ketoprak Original', 'Lontong, tahu, tauge, bihun, bumbu kacang ulek manual', 15000, 'ketoprak', 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop', true, 30, 5),
        ('Ketoprak Telur', 'Ketoprak original + telur rebus', 18000, 'ketoprak', 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop', true, 30, 5),
        ('Ketoprak Spesial', 'Ketoprak original + telur + sate tahu + kerupuk ekstra', 25000, 'ketoprak', 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop', true, 30, 5),
        ('Extra Tahu', 'Tahu goreng tambahan', 3000, 'topping', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', true, 50, 5),
        ('Extra Kerupuk', 'Kerupuk kanji tambahan', 2000, 'topping', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', true, 50, 5),
        ('Es Teh Manis', 'Teh manis dingin segar', 5000, 'minuman', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', true, 20, 5),
        ('Es Jeruk', 'Jeruk peras segar', 7000, 'minuman', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', true, 20, 5)
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

