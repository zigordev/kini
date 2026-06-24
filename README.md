# kini

Kini football pool platform monorepo.

## Repository shape

- `apps/api`: NestJS backend
- `apps/mobile`: Expo / React Native client
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
curl -fsS http://localhost:19006
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
- `GOOGLE_MOBILE_REDIRECT_URI`
- `TOLGEE_PROJECT_ID`
- `EXPO_WEB_PORT`

Translations are authored in local Tolgee from `platform-ops`. After changing translations there, rerun `npm run local:up` to refresh the tracked `apps/mobile/app/locales/*.json` snapshots before committing them.
