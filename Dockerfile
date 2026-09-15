# Multi-stage Dockerfile for Team Task Tracker API
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source code and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npx prisma generate

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production
RUN npx prisma generate

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist
COPY .env.example ./.env

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
