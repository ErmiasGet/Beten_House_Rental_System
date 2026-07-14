#!/bin/bash

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-betenhomesrent_db}"
DB_USER="${DB_USER:-betenhomesrent_user}"
DB_HOST="${DB_HOST:-postgres}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-beten-homes-rent}"

echo "📦 Creating database backup..."

mkdir -p "$BACKUP_DIR"

docker compose -p "$COMPOSE_PROJECT" exec -T "$DB_HOST" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "✅ Backup created: $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
echo "🧹 Cleaned up backups older than 7 days"
