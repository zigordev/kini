# kini

Kini football pool platform monorepo.

## Repository shape

- `apps/api`: NestJS backend
- `apps/ui`: Next.js web client
- `docker/`: root-owned local and CI compose manifests
- `infra/monitoring`: local SonarQube, Grafana, Loki, Prometheus, and Trivy support
- `.github/workflows`: CI, commit lint, CodeQL, release, and deploy entrypoints

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Start the local app stack:

```bash
npm run local:up
```

The first run creates `docker/.env.app.local` from `docker/.env.app.local.example`.
Local secrets are read from OpenBao in the `platform-ops` stack, so start
`platform-ops` first and create a `kini-local-read` OpenBao token for
`OPENBAO_TOKEN` in `docker/.env.app.local`. See `docs/local-first-start.md`.

3. Check the stack:

```bash
curl -fsS http://localhost:3012/docs
curl -fsS http://localhost:3013
```

4. Stop the stack:

```bash
npm run local:down
```

## Quality commands

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

## Git model

- The root folder is the repository boundary.
- Old standalone git metadata is preserved under `.legacy-git/` and ignored by the new repo.
- Commit messages are checked with Commitlint.
- Husky runs the local precommit quality gate when dependencies are installed.

## Release + deploy model

- Release Please manages versioning and changelog updates.
- CI validates lint, typecheck, build, API tests, compose config, and secret scanning.
- The deploy workflow is intentionally a manual placeholder until the production target is selected.

## Local Secrets

For local development, `kini` reads these values from OpenBao path `kv/kini`:

- `POSTGRES_PASSWORD`
- `SESSION_SECRET`
- `SESSION_COOKIE_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `TOLGEE_API_KEY`

Keep non-secret OAuth and translation values in `docker/.env.app.local`, including:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CALLBACK_URL`
- `TOLGEE_PROJECT_ID`
- `EDUARDO_LOSILLA_SYNC_ENABLED` (optional, defaults to `true`)
- `EDUARDO_LOSILLA_QUINIELA_TICKET_URL` (optional published ticket source URL)
- `EDUARDO_LOSILLA_QUINIELA_RESULTS_URL` (optional completed-results source URL)
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_RELEASE`
- `WEB_PORT`

Translations are authored in local Tolgee from `platform-ops`. `npm run local:up`
first uploads local translation changes, then refreshes the tracked
`apps/ui/messages/*.json` snapshots before starting the app.

## Web runtime contract

Kini uses the same `apps/api` + `apps/ui` repository shape as GPool. The browser
talks directly to the configured API and Socket.IO origins. Local defaults are:

- Web: `http://localhost:3013`
- API and Socket.IO: `http://localhost:3012`
- OAuth callback: `http://localhost:3013/auth/callback`

Because HTTP and WebSocket traffic use the API origin directly,
`AUTH_CORS_ORIGINS` must include the exact web origin and continue allowing
credentials. Production should place both origins on the same site, use HTTPS,
and use a secure session cookie. `NEXT_PUBLIC_API_BASE_URL` is a build-time
value; changing only the container environment does not rewrite an existing
browser bundle.

See [`docs/web-cutover.md`](docs/web-cutover.md) for route coverage, removed
native capabilities, deployment assumptions, and the remaining browser-E2E
gap.
