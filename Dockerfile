# F2F Web Sample - Production Dockerfile
# Multi-stage build for Next.js 16 standalone output
#
# Build context: parent directory (../) containing both F2F-web-sample and F2F-Engine
# This is needed because @f2f-engine/sdk is a local file reference.

# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /workspace/F2F-web-sample

# Copy SDK source (needed for file: reference in package.json)
COPY F2F-Engine/packages/sdk-ts/ /workspace/F2F-Engine/packages/sdk-ts/

# Install dependencies
COPY F2F-web-sample/package.json F2F-web-sample/package-lock.json* ./
RUN npm ci

# ========================================
# Stage 2: Builder
# ========================================
FROM node:22-alpine AS builder

WORKDIR /workspace/F2F-web-sample

# Copy SDK source (needed for webpack alias in next.config.ts)
COPY F2F-Engine/packages/sdk-ts/ /workspace/F2F-Engine/packages/sdk-ts/

# Copy dependencies from deps stage
COPY --from=deps /workspace/F2F-web-sample/node_modules ./node_modules

# Copy application source
COPY F2F-web-sample/ .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# ========================================
# Stage 3: Runner
# ========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /workspace/F2F-web-sample/public ./public
COPY --from=builder --chown=nextjs:nodejs /workspace/F2F-web-sample/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/F2F-web-sample/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "server.js"]
