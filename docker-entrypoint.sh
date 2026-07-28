#!/bin/sh
# Write runtime env.js from environment variables (parametrized in docker-compose)
# Cloud: set API_BASE_URL=/api so browser uses same origin, Nginx proxies to backend
API_BASE_URL="${API_BASE_URL:-}"
API_HOST="${API_HOST:-http://localhost}"
API_PORT="${API_PORT:-3033}"
echo "window.__env = { \"API_BASE_URL\": \"$API_BASE_URL\", \"API_HOST\": \"$API_HOST\", \"API_PORT\": \"$API_PORT\" };" > /usr/share/nginx/html/env.js

exec nginx -g "daemon off;"
