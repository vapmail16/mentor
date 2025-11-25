# Backend Dockerfile for DC Deploy
# Multi-stage build for optimized image size

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# npm ci requires package-lock.json for reproducible builds
# If package-lock.json doesn't exist, generate it first
RUN if [ ! -f package-lock.json ]; then \
      npm install --package-lock-only --omit=dev; \
    fi && \
    npm ci --omit=dev

# Stage 2: Production stage
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create logs directory and set ownership before copying files
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Ensure logs directory exists and has correct permissions
RUN chown -R nodejs:nodejs /app/logs && \
    chmod 755 /app/logs

# Switch to non-root user
USER nodejs

# Expose port (DC Deploy will map this)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

