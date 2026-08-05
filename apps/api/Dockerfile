FROM node:24-alpine AS build
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile
COPY apps/api apps/api
RUN pnpm --filter @jupiter/api build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /workspace/apps/api/dist ./dist
COPY --from=build /workspace/apps/api/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
