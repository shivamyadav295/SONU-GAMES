# Multi-stage build for Full-Stack MERN app
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Install client dependencies & build frontend
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npm run build

# 2. Install server dependencies & copy all server code
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

COPY server/ ./server/

# 3. Production runner image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
COPY package.json ./

EXPOSE 5000

CMD ["node", "server/server.js"]
