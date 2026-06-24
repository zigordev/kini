# Local First Start

1. Start the `platform-ops` local stack so OpenBao is available at `http://localhost:8200`.
2. Create the OpenBao secret at `kv/kini` with:
   - `POSTGRES_PASSWORD`
   - `SESSION_SECRET`
   - `SESSION_COOKIE_SECRET`
   - `GOOGLE_CLIENT_SECRET`
   - `TOLGEE_API_KEY` once the Tolgee project exists
3. Create the Tolgee project and API key if you want `local:up` to pull translation snapshots.
4. Create a read-only OpenBao policy for `kini`.
5. Create a `kini` OpenBao token from that policy.
6. Install root dependencies with `npm install`.
7. Run `npm run local:up`.
8. Fill `docker/.env.app.local` if the script created it. It must contain the `kini-local-read` token as `OPENBAO_TOKEN`, non-secret Google values such as `GOOGLE_CLIENT_ID`, and `TOLGEE_PROJECT_ID` once Tolgee is configured.
9. Rerun `npm run local:up`.
10. Open the API docs at `http://localhost:3012/docs` and the Expo web entry at `http://localhost:19006`.

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

`local:up` pulls Tolgee back into the tracked files under `apps/mobile/app/locales/*.json`.

## Create The Local OpenBao Token

Use the OpenBao root token saved during the `platform-ops` bootstrap only to create the narrower app token.
Do not put the root token in `docker/.env.app.local`.

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

## Translation Workflow

- Local Tolgee from `platform-ops` is the development authoring source.
- Tracked snapshots live in `apps/mobile/app/locales/{language}.json`.
- `npm run i18n:push:local` pushes the tracked snapshots into local Tolgee.
- `npm run local:up` pulls local Tolgee snapshots back into the tracked files when `TOLGEE_PROJECT_ID` is set.
