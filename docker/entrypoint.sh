#!/usr/bin/env bash
# Container initialization. Keep this fast and idempotent: it runs on every
# start. Long-running processes are owned by supervisord, not this script.
set -euo pipefail

cd /app

# 1. Ensure Laravel's writable directories exist (bind mounts / fresh volumes).
mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache 2>/dev/null || true

# 2. Optionally wait for PostgreSQL before booting the app.
if [ "${WAIT_FOR_DB:-true}" = "true" ] && [ "${DB_CONNECTION:-}" = "pgsql" ]; then
    db_host="${DB_HOST:-postgres}"
    db_port="${DB_PORT:-5432}"
    echo "entrypoint: waiting for postgres at ${db_host}:${db_port} ..."
    until pg_isready -h "${db_host}" -p "${db_port}" -q; do
        sleep 1
    done
    echo "entrypoint: postgres is ready."
fi

# 3. App key: only touch a real .env file; env-provided APP_KEY is used as-is.
if [ -z "${APP_KEY:-}" ] && [ -f .env ]; then
    php artisan key:generate --force
fi

# 4. Public storage symlink (no-op if it already exists).
php artisan storage:link --force 2>/dev/null || true

# 5. Warm the framework caches from the real environment. Do this here rather
#    than at build time because config depends on runtime env vars, and Octane
#    keeps the app resident so a cold config/route/view is paid on every worker.
php artisan config:cache
php artisan event:cache
php artisan view:cache
# route:cache fails when closure routes exist (this app has one), so keep it soft.
php artisan route:cache 2>/dev/null || echo "entrypoint: route:cache skipped (closure route present)"

# 6. Migrations are an explicit, opt-in deployment step. --isolated takes a
#    cache lock so only one container in a scaled deployment runs them.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "entrypoint: running migrations ..."
    php artisan migrate --force --isolated
fi

# Hand off to the container command (supervisord) as PID 1 so Docker's
# SIGTERM/SIGINT reach it and both Octane and Horizon stop gracefully.
exec "$@"
