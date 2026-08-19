# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency graphs
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy dependencies and built code
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/uploads ./uploads

EXPOSE 5000

CMD ["node", "dist/server.js"]