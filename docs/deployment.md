# Deployment

Kini currently has a manual deploy workflow placeholder. Before enabling production deploys, decide the target runtime and secrets source.

The intended repository contract matches the other app repos:

- CI owns quality gates and compose validation.
- Release Please owns version and changelog updates.
- Runtime secrets are not committed and are injected by the deployment target.
- Docker manifests live under `docker/`.
- The API and web app are built from the root lockfile with
  `apps/api/Dockerfile` and `apps/ui/Dockerfile`.
- `NEXT_PUBLIC_API_BASE_URL` is supplied while building the web image.
- The web and API origins must use HTTPS and the API must allow the exact web
  origin with credentialed CORS.
- Socket.IO connects directly to the same origin as
  `NEXT_PUBLIC_API_BASE_URL`; an ingress must support WebSocket upgrades.
- Google OAuth redirects to the web route `/auth/callback` and the API owns the
  HTTP-only session cookie.
