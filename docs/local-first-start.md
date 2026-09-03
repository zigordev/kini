# Local First Start

1. Start the `platform-ops` local stack so OpenBao is available at `http://localhost:8200`.
2. Create the OpenBao secret at `kv/kini` with:
   - `POSTGRES_PASSWORD`
   - `SESSION_SECRET`
   - `SESSION_COOKIE_SECRET`
   - `GOOGLE_CLIENT_SECRET`
   - `TOLGEE_API_KEY` once the Tolgee project exists
   - `LOTERIAS_API_KEY` once external Quiniela sync is enabled
3. Create the Tolgee project and API key if you want `local:up` to pull translation snapshots.
4. Create a read-only OpenBao policy for `kini`.
5. Create a `kini` OpenBao token from that policy.
6. Install root dependencies with `npm install`.
7. Run `npm run local:up`.
8. Fill `docker/.env.app.local` if the script created it. It must contain the `kini-local-read` token as `OPENBAO_TOKEN`, non-secret Google values such as `GOOGLE_CLIENT_ID`, and `TOLGEE_PROJECT_ID` once Tolgee is configured.
9. Rerun `npm run local:up`.
10. Open the API docs at `http://localhost:3012/docs` and the Next.js web app at `http://localhost:3013`.
11. Check the stack is actually working, not merely running:

    ```bash
    curl -fsS http://localhost:3012/health
    ```

    `status` is `ok` when the database and the broker are both up, `degraded`
    when only Kafka is gone (email queues stall; nothing else does), and
    `error` with a 503 when the database is unreachable.

The app stack uses its own Postgres container, but now depends on `platform-ops` for OpenBao secrets.

## Create The Local Tolgee Project

Open the local Tolgee UI from `platform-ops`:

```text
http://localhost:8090
```

Create a project for `kini`, add languages `en` and `es`, and create an API key that can import and export translations.

Add the API key to the existing OpenBao path `kv/kini` without removing the other app keys:

```json
{
  "TOLGEE_API_KEY": "paste_tolgee_api_key_here"
}
```

## Optional Loterías API Sync

To let Kini fetch available Quiniela pools and check official results, add the provider key to the same OpenBao path:

```json
{
  "LOTERIAS_API_KEY": "paste_loterias_api_key_here"
}
```

Do not put `LOTERIAS_API_KEY` in `docker/.env.app.local`; the API process receives it from OpenBao through `openbao-run`. The backend sync runs weekly on Monday at 08:00 and can also be triggered from the Available Pools screen. Without this key, the catalog screen still works but no external data is fetched.

Keep the numeric project id in `docker/.env.app.local`:

```env
TOLGEE_PROJECT_ID=paste_project_id_here
```

Seed Tolgee from the tracked local snapshots:

```bash
npm run i18n:push:local
```

After that, edit translations in Tolgee and rerun:

```bash
npm run local:up
```

`local:up` pulls Tolgee back into the tracked files under
`apps/ui/messages/*.json`.

## Create The Local OpenBao Token

Use the OpenBao root token saved during the `platform-ops` bootstrap only to create the narrower app token.
Do not put the root token in `docker/.env.app.local`.

The recommended path securely prompts for the root token, creates the policy
and app token, updates the ignored local env file, and verifies access without
printing either token:

```bash
npm run local:token
```

The equivalent manual commands are below.

Create the read-only policy:

```bash
ROOT_TOKEN='paste_root_token_here'

docker compose --env-file ../platform-ops/docker/.env.ops.local -f ../platform-ops/docker/compose.ops.local.yml exec -T \
  -e BAO_ADDR=http://127.0.0.1:8200 \
  -e BAO_TOKEN="$ROOT_TOKEN" \
  openbao bao policy write kini-local-read - <<'EOF'
path "kv/data/kini" { capabilities = ["read"] }
path "kv/metadata/kini" { capabilities = ["read"] }
EOF
```

Create the app token:

```bash
ROOT_TOKEN='paste_root_token_here'

docker compose --env-file ../platform-ops/docker/.env.ops.local -f ../platform-ops/docker/compose.ops.local.yml exec -T \
  -e BAO_ADDR=http://127.0.0.1:8200 \
  -e BAO_TOKEN="$ROOT_TOKEN" \
  openbao bao token create -policy=kini-local-read -format=json \
  | jq -r '.auth.client_token'
```

Copy the printed token into `docker/.env.app.local`:

```env
OPENBAO_TOKEN=paste_kini_local_read_token_here
```

## Troubleshooting OpenBao Access

`status=403` means the existing `OPENBAO_TOKEN` is invalid, expired, revoked,
or does not have the `kini-local-read` policy. Run `npm run local:token`, or
repeat the manual policy and token commands above with the saved OpenBao root
token. Never put the root token in the app environment file.

`status=404` means the token was accepted but `kv/kini` does not exist. Create
the secret with the required keys listed at the start of this runbook.

## Translation Workflow

- Local Tolgee from `platform-ops` is the development authoring source.
- Tracked snapshots live in `apps/ui/messages/{language}.json`.
- `npm run i18n:push:local` pushes the tracked snapshots into local Tolgee.
- `npm run local:up` pulls local Tolgee snapshots back into the tracked files when `TOLGEE_PROJECT_ID` is set.
