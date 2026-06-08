#!/bin/sh
set -e

echo "[entrypoint] Waiting for database..."
until php -r "new PDO('mysql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}');" 2>/dev/null; do
  echo "[entrypoint] DB not ready — retrying in 2s..."
  sleep 2
done
echo "[entrypoint] Database is up."

# Générer APP_KEY si absent (premier démarrage sans .env injecté)
if [ -z "$APP_KEY" ]; then
  echo "[entrypoint] APP_KEY manquant — génération automatique..."
  php artisan key:generate --force
fi

# Appliquer les migrations (idempotent — ne touche pas aux données existantes)
echo "[entrypoint] Running migrations..."
php artisan migrate --force
echo "[entrypoint] Migrations OK."

# Créer le compte admin initial si la table users est vide
php artisan db:seed --class=DatabaseSeeder --force 2>/dev/null || true

# Caches Laravel (améliore les performances en production)
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "[entrypoint] Starting PHP-FPM..."
exec "$@"
