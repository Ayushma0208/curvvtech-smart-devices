# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Only prod deps
COPY package*.json ./
RUN npm ci --omit=dev
# App dist only
COPY --from=builder /app/dist ./dist
# Ensure exports dir exists (for data export feature)
RUN mkdir -p /app/exports
EXPOSE 4000
CMD ["node", "dist/index.js"]
