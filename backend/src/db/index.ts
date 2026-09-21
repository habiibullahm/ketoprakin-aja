import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import dns from "node:dns"
import * as schema from "./schema"
import dotenv from "dotenv"

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const usesNeonPooler = connectionString.includes('.neon.tech') && connectionString.includes('-pooler')
if (usesNeonPooler) {
  dns.setDefaultResultOrder('ipv4first')
  const lookup = dns.lookup as any
  dns.lookup = ((hostname: string, options: any, callback: any) => {
    if (typeof options === 'function') return lookup(hostname, { family: 4 }, options)
    return lookup(hostname, { ...options, family: 4 }, callback)
  }) as typeof dns.lookup
}
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
