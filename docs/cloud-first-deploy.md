# Cloud First Deploy (kini)

Use this runbook when you are deploying `kini` to AWS from scratch.
Complete `platform-ops/docs/cloud-first-deploy.md` first. `kini` depends on the shared production host, OpenBao, Redpanda and ingress managed there.

## 1. What You Are Building

When this runbook is complete, you will have:

- `kini` API and web images published to ECR, signed and attested by digest
- a `kini` application deployment running on the shared EC2 host
- Google OAuth login working in production
- runtime secrets stored in OpenBao and SSM
- notification publishing wired to the shared platform Kafka broker
- public routing handled by the shared `platform-ops` ingress

Unlike `gpool`, `kini` reads no translations at runtime: the web app ships the
tracked `apps/web/messages/*.json` snapshots, so there is no production Tolgee
project, no runtime Tolgee key and no promotion workflow.

## 2. Prerequisites

Run every command in this document from the `kini` repo root unless stated otherwise.

Required:

- `platform-ops` production is already deployed
- OpenBao production is initialized, unsealed, and has `kv` v2 enabled
- AWS CLI with access to the target account
- `jq`
- GitHub access to configure repository environments
- access to a Google Cloud project where you can create a production OAuth client

## 3. Prepare Google OAuth

Create a Google OAuth client for production with:

- application type: `Web application`
- authorized JavaScript origin: `https://kini.zigordev.com`
- authorized redirect URI: `https://kini-api.zigordev.com/auth/google/callback`
  - the API completes the OAuth exchange, not the web app, so the redirect URI is on the API host

If your final public domain is different, use the real domain instead.

You will need:

- the Google client id for tracked file `docker/.env.app.prod`
- the Google client secret for OpenBao secret `kv/kini`

## 4. Configure The GitHub `production` Environment

In the `kini` GitHub repository, create or update environment `production`.

Required environment variables:

- `AWS_REGION`
  - AWS region used by the workflow
- `AWS_ECR_API_REPOSITORY_URI`
  - ECR repository for the API image
- `AWS_ECR_WEB_REPOSITORY_URI`
  - ECR repository for the web image
- `AWS_DEPLOY_BUCKET`
  - S3 bucket used for deploy bundles
- `AWS_DEPLOY_INSTANCE_ID`
  - EC2 instance targeted through SSM
- `AWS_SSM_APP_PREFIX`
  - SSM prefix for `kini`, for example `/kini/prod/app`

Required environment secret:

- `AWS_DEPLOY_ROLE_ARN`
  - IAM role assumed by GitHub Actions through OIDC

Both ECR repositories must exist before the first deploy, and their tags are
immutable: a redeploy of an existing release tag skips the build and deploys the
image already in ECR.

## 5. Review The Tracked Non-Secret Config

Review `docker/.env.app.prod` before the first deploy. It is tracked on purpose —
nothing in it is secret — and it is the file the deploy renders on the host:

- `AUTH_CORS_ORIGINS`, `FRONTEND_URL`, `AUTH_SUCCESS_REDIRECT_URL` and
  `AUTH_FAILURE_REDIRECT_URL` must name the real web origin
- `GOOGLE_CLIENT_ID` and `GOOGLE_CALLBACK_URL` must match the Google client from
  step 3 exactly
- `NEXT_PUBLIC_API_BASE_URL` is baked into the web image at build time, so it has
  to be the public API origin, not an internal name
- `NEXT_PUBLIC_RELEASE` is overwritten with the release tag by the deploy script;
  the tracked value is only a placeholder
- `API_IMAGE` and `WEB_IMAGE` are written by the deploy script and must stay
  `REQUIRED_SET_BY_DEPLOY` in the tracked file
- `TRUST_PROXY=1` is required because the app sits behind the shared ingress

## 6. Create The OpenBao Secret `kv/kini`

Create secret path `kv/kini` in the OpenBao production UI.

Add these keys:

- `SESSION_SECRET` and `SESSION_COOKIE_SECRET`
  - generate with `openssl rand -hex 32`
- `GOOGLE_CLIENT_SECRET`
  - production Google OAuth client secret
- `POSTGRES_PASSWORD`
  - production database password for `kini`

The API enforces the first three at startup through `OPENBAO_REQUIRED_KEYS` and
exits if any is missing. `POSTGRES_PASSWORD` is read by the remote deploy script
itself, which fails before starting anything if the key is absent.

## 7. Create The OpenBao Read Policy And App Token

Open an SSM shell on the production EC2 instance:

```bash
aws ssm start-session --profile platform-ops --target <AWS_DEPLOY_INSTANCE_ID> --region <AWS_REGION>
```

Inside that shell, resolve the latest `platform-ops` release directory:

```bash
OPS_DIR="$(ls -1dt /opt/platform-ops/releases/* | head -n1)"
echo "$OPS_DIR"
```

Create the narrow read policy:

```bash
ROOT_TOKEN='paste_openbao_root_token'

sudo docker compose --env-file "$OPS_DIR/docker/.env.ops.prod" -f "$OPS_DIR/docker/compose.ops.prod.yml" exec -T \
  -e BAO_ADDR=http://127.0.0.1:8200 \
  -e BAO_TOKEN="$ROOT_TOKEN" \
  openbao sh -lc "
cat > /tmp/kini-prod-read.hcl <<'EOF'
path \"kv/data/kini\" { capabilities = [\"read\"] }
path \"kv/metadata/kini\" { capabilities = [\"read\"] }
EOF
bao policy write kini-prod-read /tmp/kini-prod-read.hcl
"
```

Create the token:

```bash
KINI_OPENBAO_TOKEN="$(
  sudo docker compose --env-file "$OPS_DIR/docker/.env.ops.prod" -f "$OPS_DIR/docker/compose.ops.prod.yml" exec -T \
    -e BAO_ADDR=http://127.0.0.1:8200 \
    -e BAO_TOKEN="$ROOT_TOKEN" \
    openbao bao token create -policy=kini-prod-read -format=json | jq -r '.auth.client_token'
)"
echo "$KINI_OPENBAO_TOKEN"
```

Use this app token only for `kini`.

## 8. Store The App Token In SSM

Store the `kini` OpenBao token under the app SSM prefix:

```bash
aws ssm put-parameter \
  --profile platform-ops \
  --name /kini/prod/app/OPENBAO_TOKEN \
  --type SecureString \
  --value "$KINI_OPENBAO_TOKEN" \
  --overwrite \
  --region <AWS_REGION>
```

If your prefix differs, use:

```bash
${AWS_SSM_APP_PREFIX}/OPENBAO_TOKEN
```

## 9. Trigger The First Deploy

The workflow is:

- `Deploy AWS App (EC2 Compose)` in `.github/workflows/deploy.yml`

Trigger it by:

- publishing a release tag — release-please opens the release PR, and merging it
  publishes the tag
- or running `workflow_dispatch` with an existing `release_tag`

The workflow builds and pushes both images, resolves each pushed digest from ECR,
signs and attests them keylessly by digest, uploads the deploy bundle to S3 and
runs the remote deploy script over SSM. The production host is powered on only
inside its weekday window, so a deploy outside that window has nothing to reach.

## 10. Validate The Production App

Validate the public API:

```bash
curl -fsS https://kini-api.zigordev.com/health
```

Validate the public web app:

```bash
curl -fsS https://kini.zigordev.com/health
```

Recommended manual checks:

- complete a Google login flow in the browser
- create a pool and confirm it survives a page reload, which exercises Postgres
- exercise a flow that publishes a notification event

## 11. Troubleshooting

Google login fails in production:

- `GOOGLE_CALLBACK_URL` does not exactly match the Google Cloud client
- `GOOGLE_CLIENT_ID` is wrong in `docker/.env.app.prod`
- `GOOGLE_CLIENT_SECRET` is wrong in OpenBao

The web app loads but every API call fails:

- `NEXT_PUBLIC_API_BASE_URL` was baked with the wrong origin — it is a build
  argument, so this needs a new image, not an env change
- `AUTH_CORS_ORIGINS` does not name the exact web origin, credentials included

Deploy fails when reading OpenBao:

- OpenBao is sealed
- `kv/kini` does not exist
- the token stored in SSM does not match the `kini-prod-read` policy
- `kv/kini` is missing `POSTGRES_PASSWORD`, which the deploy script reads before
  it starts anything

Notification publishing fails:

- `NOTIFICATIONS_KAFKA_BROKERS` is wrong
- the shared Redpanda service in `platform-ops` is not reachable from the production host
