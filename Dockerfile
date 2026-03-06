# Production Dockerfile for Render: builds frontend + backend, single service
# Use from repo root. Render sets PORT (default 10000).

# ---- Frontend build ----
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
# Same-origin when served by this server; no VITE_SERVER_URL needed
RUN npm run build

# ---- Backend build ----
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# ---- Production image ----
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./public

# Render expects bind to PORT (default 10000)
ENV PORT=10000
EXPOSE 10000

CMD ["node", "dist/index.js"]
