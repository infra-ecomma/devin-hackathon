# Build stage — compiles the VS Code extension
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run compile

# Production stage — serves a static landing page
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g serve

COPY --from=builder /app/public ./public
COPY --from=builder /app/out ./out
COPY --from=builder /app/media ./media
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["serve", "public", "-l", "3000", "--no-clipboard"]
