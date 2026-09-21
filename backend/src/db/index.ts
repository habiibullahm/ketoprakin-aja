import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import dotenv from "dotenv"

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const usesNeonPooler = connectionString.includes('.neon.tech') && connectionString.includes('-pooler')
const postgresOptions = {
  connect_timeout: 30,
  max: usesNeonPooler ? 5 : 10,
  ...(usesNeonPooler ? { prepare: false } : {}),
}

// Neon pooler uses transaction pooling, so prepared statements must be disabled.
const queryClient = postgres(connectionString, postgresOptions)
export const db = drizzle(queryClient, { schema })

// For migrations
export const migrationClient = postgres(connectionString, { ...postgresOptions, max: 1 })
