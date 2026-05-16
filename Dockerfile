FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxt

COPY --from=build /app/.output /app/.output
COPY --from=build /app/node_modules/.cache/sharp /app/.output/sharp-cache

ENV HOST=0.0.0.0 PORT=3000 NODE_ENV=production

EXPOSE 3000

USER nuxt

CMD ["node", ".output/server/index.mjs"]
