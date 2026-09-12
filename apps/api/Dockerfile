FROM node:24-alpine AS base
WORKDIR /workspace

FROM base AS deps-build
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN HUSKY=0 npm ci --workspace @kini/api --include-workspace-root --ignore-scripts
RUN mkdir -p /workspace/apps/api/node_modules

FROM base AS deps-prod
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN HUSKY=0 npm ci --workspace @kini/api --include-workspace-root --omit=dev --ignore-scripts

FROM base AS build
ENV NODE_ENV=production
COPY --from=deps-build /workspace/node_modules /workspace/node_modules
COPY --from=deps-build /workspace/apps/api/node_modules /workspace/apps/api/node_modules
COPY package.json /workspace/package.json
COPY apps/api /workspace/apps/api
WORKDIR /workspace/apps/api
RUN npm run build

FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
# Pull the latest Alpine security patches at build time rather than waiting on
# the upstream node:24-alpine tag to be rebuilt, and drop the bundled npm CLI —
# this image only ever runs `node dist/main.js`, so npm/npx/corepack (and their
# own vendored, separately-versioned dependencies) are attack surface with no
# legitimate use here.
RUN apk upgrade --no-cache \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
COPY --from=deps-prod --chown=node:node /workspace/node_modules /app/node_modules
COPY --from=build --chown=node:node /workspace/apps/api/dist /app/apps/api/dist
COPY --from=build --chown=node:node /workspace/apps/api/package.json /app/apps/api/package.json
COPY --chown=node:node apps/api/scripts/openbao-run.mjs /app/scripts/openbao-run.mjs
WORKDIR /app/apps/api
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM prod AS local

FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps-build /workspace/node_modules /workspace/node_modules
COPY --from=deps-build /workspace/apps/api/node_modules /workspace/apps/api/node_modules
COPY package.json package-lock.json /workspace/
COPY apps/api/scripts/openbao-run.mjs /workspace/scripts/openbao-run.mjs
COPY apps/api /workspace/apps/api
WORKDIR /workspace/apps/api
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
