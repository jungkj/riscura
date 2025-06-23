# Multi-stage Dockerfile for Riscura Production Deployment
# Stage 1: Dependencies
FROM node:18-alpine AS dependencies

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    ca-certificates \
    dumb-init \
    && update-ca-certificates

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies with cache optimization
RUN yarn install --frozen-lockfile --production=false --network-timeout 600000

# Stage 2: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN yarn build

# Remove dev dependencies
RUN yarn install --frozen-lockfile --production=true --ignore-scripts --prefer-offline

# Stage 3: Production Runtime
FROM node:18-alpine AS runner

# Security hardening
RUN apk add --no-cache \
    dumb-init \
    ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Create necessary directories
RUN mkdir -p /app/logs /app/tmp \
    && chown -R nextjs:nodejs /app/logs /app/tmp

# Security: Remove unnecessary packages and files
RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node healthcheck.js || exit 1

# Copy health check script
COPY --chown=nextjs:nodejs scripts/healthcheck.js ./healthcheck.js

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

# Labels for metadata
LABEL maintainer="Riscura Security Team <security@riscura.com>"
LABEL version="1.0.0"
LABEL description="Riscura Risk Management Platform"
LABEL org.opencontainers.image.source="https://github.com/riscura/platform"
LABEL org.opencontainers.image.title="Riscura Platform"
LABEL org.opencontainers.image.description="Enterprise Risk Management Platform"
LABEL org.opencontainers.image.vendor="Riscura"
LABEL org.opencontainers.image.licenses="Proprietary" 