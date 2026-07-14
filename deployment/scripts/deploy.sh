#!/bin/bash

set -e

echo "🚀 Beten Homes Rent Deployment Script"
echo "============================"

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }

# Load environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
    echo "✅ Loaded environment variables"
fi

COMPOSE_FILES="-f docker-compose.yml"

# Build and deploy
echo "🏗️  Building Docker images..."
docker compose $COMPOSE_FILES build

echo "🔄 Starting services..."
docker compose $COMPOSE_FILES up -d

# Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Run database migrations
echo "🗄️  Running database migrations..."
docker compose $COMPOSE_FILES exec -T backend npx prisma migrate deploy

# Seed database
echo "🌱 Seeding database..."
docker compose $COMPOSE_FILES exec -T backend npx prisma db seed

echo "✅ Deployment completed successfully!"
echo "📱 Frontend: https://localhost"
echo "🔧 Backend API: https://localhost/api"
echo "🗄️  Database: localhost:5432"
