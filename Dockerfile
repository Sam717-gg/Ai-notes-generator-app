# Production Dockerfile for AI Notes Generator App

# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm ci

# Copy all source and build
COPY . .
RUN npm run build

# Runtime Stage
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist

# Simple static server for production
RUN npm install -g serve

EXPOSE 3000
ENV NODE_ENV=production

CMD ["serve", "-s", "dist", "-l", "3000"]
