FROM node:20-alpine AS base
WORKDIR /workspace

FROM base AS dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/ui/package.json apps/ui/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN HUSKY=0 npm ci --workspace @kini/api --include-workspace-root --ignore-scripts

FROM base AS production-dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/ui/package.json apps/ui/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN HUSKY=0 npm ci --workspace @kini/api --include-workspace-root --omit=dev --ignore-scripts

FROM base AS build
ENV NODE_ENV=production
COPY --from=dependencies /workspace/node_modules /workspace/node_modules
COPY package.json /workspace/package.json
COPY apps/api /workspace/apps/api
WORKDIR /workspace/apps/api
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=production-dependencies --chown=node:node /workspace/node_modules /app/node_modules
COPY --from=build --chown=node:node /workspace/apps/api/dist /app/apps/api/dist
COPY --from=build --chown=node:node /workspace/apps/api/package.json /app/apps/api/package.json
COPY --chown=node:node apps/api/scripts/openbao-run.mjs /app/scripts/openbao-run.mjs
WORKDIR /app/apps/api
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM runtime AS local
