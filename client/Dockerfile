# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy shared folder from server first (required for TypeScript)
COPY server/shared ../server/shared

# Copy package files
COPY client/package.json client/pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy client source code (specific folders to avoid overwriting node_modules)
COPY client/src ./src
COPY client/public ./public
COPY client/*.ts ./
COPY client/*.json ./
COPY client/*.html ./
COPY client/*.cjs ./
COPY client/*.js ./
COPY client/.env* ./

# Build the application
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY client/nginx.conf /etc/nginx/nginx.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
