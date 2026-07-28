# Stage 1: Build the Vite React app
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (including devDependencies for the build)
RUN npm install --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve the app
FROM nginx:alpine

# Vite outputs to dist/
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config (SPA routing + /api proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint writes env.js from API_HOST/API_PORT at runtime, then starts nginx
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
