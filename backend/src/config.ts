const configuredJwtSecret = process.env.JWT_SECRET

if (!configuredJwtSecret || configuredJwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be set and contain at least 32 characters")
}

export const jwtSecret: string = configuredJwtSecret

