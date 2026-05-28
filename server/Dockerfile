# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY server/package.json server/pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code (including shared folder)
COPY server/src ./src
COPY server/shared ./shared
COPY server/*.ts ./
COPY server/*.json ./
COPY server/.env.production ./.env

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY server/package.json server/pnpm-lock.yaml ./

# Install pnpm and production dependencies only
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy built files from builder stage
COPY --from=builder /app/dist/src ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/.env ./.env

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]