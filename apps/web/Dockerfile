FROM node:24-alpine AS base
WORKDIR /workspace

FROM base AS dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN HUSKY=0 npm ci --workspace @kini/web --include-workspace-root --ignore-scripts
RUN mkdir -p /workspace/apps/web/node_modules

FROM base AS build
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3012
ARG NEXT_PUBLIC_RELEASE=local
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_RELEASE=${NEXT_PUBLIC_RELEASE}
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /workspace/node_modules /workspace/node_modules
COPY --from=dependencies /workspace/apps/web/node_modules /workspace/apps/web/node_modules
COPY package.json /workspace/package.json
COPY apps/web /workspace/apps/web
WORKDIR /workspace/apps/web
RUN npm run build

FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
# Same as cv and gpool's web images: patch Alpine's OpenSSL at build time
# rather than waiting on the upstream tag, and drop the bundled npm/yarn CLIs
# — a standalone Next.js server has no legitimate use for either.
RUN apk upgrade --no-cache zlib libcrypto3 libssl3 \
 && rm -rf /usr/local/lib/node_modules/npm /opt/yarn-v1.22.22 \
 && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
COPY --from=build --chown=node:node /workspace/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /workspace/apps/web/public ./apps/web/public
USER node
EXPOSE 3001
CMD ["node", "apps/web/server.js"]

FROM base AS dev
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /workspace/node_modules /workspace/node_modules
COPY --from=dependencies /workspace/apps/web/node_modules /workspace/apps/web/node_modules
COPY package.json package-lock.json /workspace/
COPY apps/web /workspace/apps/web
WORKDIR /workspace/apps/web
EXPOSE 3001
CMD ["npm", "exec", "--", "next", "dev", "-H", "0.0.0.0", "-p", "3001"]
