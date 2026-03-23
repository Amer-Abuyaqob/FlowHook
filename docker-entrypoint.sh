#!/bin/sh
set -e
echo "Running database migrations..."
npx drizzle-kit migrate --config=drizzle.docker.config.cjs
echo "Starting application..."
exec "$@"
