FROM node:20-alpine AS base
WORKDIR /workspace

FROM base AS dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/ui/package.json apps/ui/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN HUSKY=0 npm ci --workspace @kini/web --include-workspace-root --ignore-scripts

FROM base AS build
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3012
ARG NEXT_PUBLIC_RELEASE=local
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_RELEASE=${NEXT_PUBLIC_RELEASE}
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /workspace/node_modules /workspace/node_modules
COPY package.json /workspace/package.json
COPY apps/ui /workspace/apps/ui
WORKDIR /workspace/apps/ui
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /workspace/apps/ui/.next/standalone ./
COPY --from=build --chown=node:node /workspace/apps/ui/.next/static ./apps/ui/.next/static
COPY --from=build --chown=node:node /workspace/apps/ui/public ./apps/ui/public
USER node
EXPOSE 3001
CMD ["node", "apps/ui/server.js"]
