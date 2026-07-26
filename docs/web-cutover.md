# Web Cutover

Kini is now a browser-only product with the same top-level application shape as
GPool:

- `apps/api`: NestJS API
- `apps/ui`: Next.js web application

The Expo Router application, native iOS and Android projects, native control
bridges, mobile OAuth token exchange, Expo push-token storage, and legacy mobile
Compose manifest have been removed.

## Product routes

| Route                    | Purpose                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `/login`                 | Stable login entrypoint; the application shell presents Google sign-in                              |
| `/auth/callback`         | Completes API-owned Google OAuth and restores the original path                                     |
| `/teams`                 | Create, choose, refresh, and invite users to teams                                                  |
| `/teams/[teamId]/accept` | Accept a team invitation                                                                            |
| `/available-pools`       | Sync the provider catalog, maintain official results, and add a pool to a team                      |
| `/pools`                 | Pool history, prediction editing, Full-15 scores, E8, assignments, configuration, and result checks |
| `/create-pool`           | Create a manual pool with up to 15 matches and assignments                                          |
| `/stats`                 | Team ranking, balance, result combinations, and success metrics                                     |
| `/profile`               | Team, language, theme, pool defaults, and sign-out                                                  |

English and Spanish JSON snapshots remain integrated with the existing Tolgee
workflow. Theme and team-local pool defaults remain browser preferences and
authenticated preferences are persisted through the API.

## Browser-to-API decision

HTTP and Socket.IO use `NEXT_PUBLIC_API_BASE_URL` directly. This preserves the
API-owned session cookie and the existing WebSocket gateway without introducing
a partial proxy that handles HTTP but not WebSocket upgrades.

Local development uses web `http://localhost:3013` and API
`http://localhost:3012`. Deployments must:

- build the UI with the externally reachable HTTPS API origin;
- allow the exact web origin through credentialed API CORS;
- place the two origins on the same site for predictable cookie behavior;
- configure a secure HTTP-only session cookie; and
- support WebSocket upgrades on the API ingress.

## Verification scope

Vitest covers the browser API client's credential, mutation, error, no-content,
and query behavior; pool status/outcome/default helpers; and English/Spanish key
parity. The production Next.js build and existing API test suite are part of the
repository quality gate.

Full browser automation of Google OAuth and authenticated team/pool journeys is
not included in this cutover because it requires a test identity and a running
database/API. Add Playwright coverage against the CI Compose stack before
enabling unattended production deployment. The deploy workflow remains the
pre-existing manual placeholder.
