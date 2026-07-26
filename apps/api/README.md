# Kini API

NestJS API for the Kini web application. It owns Google OAuth sessions, teams,
football pools and matches, statistics, provider synchronization, Socket.IO
updates, and Kafka email-notification publishing.

Run workspace commands from the repository root:

```bash
npm ci
npm run start:dev -w @kini/api
npm run lint -w @kini/api
npm run typecheck -w @kini/api
npm test -w @kini/api
npm run test:cov:api
npm run build -w @kini/api
```

The local API is exposed at `http://localhost:3012`; Swagger is available at
`/docs`. The supported full-stack path is documented in
[`../../docs/local-first-start.md`](../../docs/local-first-start.md).

## Browser authentication contract

The Next.js application calls this API directly with credentialed requests. A
successful Google OAuth callback creates the HTTP-only API session cookie and
redirects to the configured web callback.

Required non-secret configuration includes:

```dotenv
GOOGLE_CALLBACK_URL=http://localhost:3012/auth/google/callback
AUTH_SUCCESS_REDIRECT_URL=http://localhost:3013/auth/callback
AUTH_FAILURE_REDIRECT_URL=http://localhost:3013/auth/callback
AUTH_CORS_ORIGINS=http://localhost:3013
FRONTEND_URL=http://localhost:3013
SESSION_COOKIE_NAME=kini.sid
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_MAX_AGE_MS=604800000
SESSION_COOKIE_SAME_SITE=lax
```

`GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, and `SESSION_COOKIE_SECRET` are read
from OpenBao by the Compose entrypoint. Production web and API origins must use
compatible cookie `SameSite`, `Secure`, domain, HTTPS, CORS, and Socket.IO
settings; see [`../../docs/web-cutover.md`](../../docs/web-cutover.md).

The current `express-session` MemoryStore is suitable only for a single local
process. Replace it with a durable shared session store before scaling or
enabling production.

## Database lifecycle

Local and CI Compose currently use TypeORM synchronization to provision the
schema. Production defaults synchronization off. There is not yet a versioned
migration history, so an existing database cannot be upgraded reproducibly.
Adding migrations and separating migration privileges from runtime privileges
is required before production rollout.

## Testing

The maintained API gate is the Jest unit/service suite with coverage. The
deleted Nest starter E2E test asserted an endpoint that does not exist and was
not a valid project check. Authenticated API and browser E2E coverage remains a
cutover requirement rather than a passing-but-inert script.
