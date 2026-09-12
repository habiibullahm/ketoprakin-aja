#!/bin/bash

# Database initialization script
# This script runs migrations and seeds the database

set -e

echo "🔄 Starting database initialization..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until pg_isready -h postgres -p 5432 -U postgres; do
  sleep 2
done

echo "✅ Database is ready!"

# Run migrations
echo "🔄 Running migrations..."
npm run db:migrate

# Seed database (optional)
echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Database initialization complete!"
