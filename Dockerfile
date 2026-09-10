# syntax=docker/dockerfile:1.7

# Pinned, overridable base images.
ARG PHP_BASE=dunglas/frankenphp:1-php8.4-bookworm
ARG NODE_IMAGE=node:22-bookworm-slim
ARG COMPOSER_IMAGE=composer:2.8

# --- tool images (only referenced via COPY --from) --------------------------
FROM ${COMPOSER_IMAGE} AS composer
FROM ${NODE_IMAGE} AS node

# ---------------------------------------------------------------------------
# Stage 1: base runtime — PHP + FrankenPHP + the extensions the app needs.
# Every later stage builds on this so PHP behaves identically at build and run.
# ---------------------------------------------------------------------------
FROM ${PHP_BASE} AS base

# PHP extensions the app needs on top of the base image (which already ships
# opcache, mbstring, sodium, posix, ...): pcntl for Octane/Horizon, pdo_pgsql
# for PostgreSQL, redis for phpredis (matches REDIS_CLIENT=phpredis).
RUN set -eux; \
    install-php-extensions \
        pcntl \
        pdo_pgsql \
        redis \
        intl \
        zip \
        bcmath; \
    apt-get update; \
    apt-get install -y --no-install-recommends postgresql-client; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*

COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/z-opcache.ini
COPY docker/php/hardening.ini /usr/local/etc/php/conf.d/zz-hardening.ini
COPY docker/frankenphp/Caddyfile /etc/frankenphp/Caddyfile
COPY --from=composer /usr/bin/composer /usr/local/bin/composer

# Non-root application user (uid/gid 1000).
RUN groupadd --gid 1000 app \
 && useradd --uid 1000 --gid app --create-home --shell /bin/bash app

WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 2: Composer dependencies — production only, authoritative autoloader.
# ---------------------------------------------------------------------------
FROM base AS vendor

# Resolve/install from the lock file with only the manifests in context,
# so this layer is cached until composer.json / composer.lock change.
COPY composer.json composer.lock ./
RUN composer install \
        --no-dev --no-scripts --no-autoloader \
        --prefer-dist --no-interaction --no-progress

# Full source is needed to build a classmap-authoritative autoloader.
COPY . .
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative --no-interaction

# ---------------------------------------------------------------------------
# Stage 3: front-end assets — Vite + Tailwind + Wayfinder.
# PHP is present because @laravel/vite-plugin-wayfinder shells out to
# `php artisan wayfinder:generate` during `npm run build`.
# ---------------------------------------------------------------------------
FROM base AS frontend

# Node toolchain from the official image (same Debian release as the base).
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Composer vendor dir so artisan can boot during the Vite build (Wayfinder).
COPY --from=vendor /app/vendor ./vendor

# Node deps, cached on the lock file only.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Source + production build. A throwaway .env/APP_KEY only lets artisan boot;
# it is deleted before the stage output is consumed and never reaches runtime.
COPY . .
RUN set -eux; \
    cp .env.example .env; \
    php artisan key:generate --force; \
    npm run build; \
    rm -f .env

# ---------------------------------------------------------------------------
# Stage 4: final runtime image.
# ---------------------------------------------------------------------------
FROM base AS app

# - supervisor manages the two long-running processes; curl is for HEALTHCHECK
# - the FrankenPHP base points XDG_CONFIG_HOME=/config and XDG_DATA_HOME=/data at
#   Caddy/psysh storage, so those must be writable by the non-root app user.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends supervisor curl; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*; \
    mkdir -p /data/caddy /config/caddy /config/psysh; \
    chown -R app:app /data /config

# Application source, then the built artifacts from the earlier stages.
COPY --chown=app:app . .
COPY --from=vendor   --chown=app:app /app/vendor       ./vendor
COPY --from=frontend --chown=app:app /app/public/build ./public/build

# Writable runtime directories.
RUN set -eux; \
    mkdir -p \
        storage/app/public \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache; \
    chown -R app:app storage bootstrap/cache; \
    chmod -R ug+rwX storage bootstrap/cache

COPY docker/supervisor/supervisord.conf /etc/supervisor/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

USER app

ENV OCTANE_SERVER=frankenphp \
    OCTANE_WORKERS=auto \
    OCTANE_MAX_REQUESTS=500

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
    CMD curl -fsS http://127.0.0.1:8000/up || exit 1

# entrypoint = one-time init, then exec's supervisord as PID 1.
ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
