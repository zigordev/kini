#!/usr/bin/env bash
set -euo pipefail

APP_ENV_FILE="docker/.env.app.local"
APP_ENV_EXAMPLE_FILE="docker/.env.app.local.example"
OPENBAO_LOCAL_ADDR="http://localhost:8200"
OPENBAO_KV_MOUNT="kv"
OPENBAO_SECRET_PATH="kini"
OPENBAO_REQUIRED_KEYS="POSTGRES_PASSWORD,SESSION_SECRET,SESSION_COOKIE_SECRET,GOOGLE_CLIENT_SECRET"
TOLGEE_LOCAL_ADDR="http://localhost:8090"

read_env_var_from_file() {
  local file="$1"
  local key="$2"
  local line
  line="$(grep -E "^${key}=" "$file" | tail -n1 || true)"
  if [ -z "$line" ]; then
    printf ''
    return
  fi
  printf '%s' "${line#*=}"
}

pull_tolgee_messages() {
  local project_id="$1"
  echo "Pulling Tolgee snapshots for local messages..."
  OPENBAO_ADDR="$OPENBAO_LOCAL_ADDR" \
  OPENBAO_TOKEN="$openbao_token" \
  OPENBAO_KV_MOUNT="$OPENBAO_KV_MOUNT" \
  OPENBAO_SECRET_PATH="$OPENBAO_SECRET_PATH" \
  OPENBAO_REQUIRED_KEYS="TOLGEE_API_KEY" \
  TOLGEE_API_URL="$TOLGEE_LOCAL_ADDR" \
  TOLGEE_PROJECT_ID="$project_id" \
    node apps/api/scripts/openbao-run.mjs -- npm run i18n:pull -w @kini/mobile
}

if [[ ! -f "${APP_ENV_FILE}" ]]; then
  cp "${APP_ENV_EXAMPLE_FILE}" "${APP_ENV_FILE}"
  echo "Created ${APP_ENV_FILE}. Review the values, then rerun npm run local:up."
  exit 1
fi

openbao_token="$(read_env_var_from_file "$APP_ENV_FILE" "OPENBAO_TOKEN")"
tolgee_project_id="$(read_env_var_from_file "$APP_ENV_FILE" "TOLGEE_PROJECT_ID")"
required_keys="$OPENBAO_REQUIRED_KEYS"

if [ -z "$openbao_token" ]; then
  echo "OPENBAO_TOKEN is required in $APP_ENV_FILE" >&2
  exit 1
fi

if [ "$openbao_token" = "CHANGE_ME_LOCAL_OPENBAO_TOKEN" ]; then
  echo "OPENBAO_TOKEN in $APP_ENV_FILE still has the example value. Update it before retrying." >&2
  exit 1
fi

if [ -n "$tolgee_project_id" ]; then
  required_keys="${required_keys},TOLGEE_API_KEY"
fi

echo "Waiting for OpenBao at ${OPENBAO_LOCAL_ADDR}..."
i=1
openbao_code=""
while [ $i -le 60 ]; do
  openbao_code="$(curl -s -o /dev/null -w '%{http_code}' "$OPENBAO_LOCAL_ADDR/v1/sys/health" || true)"
  case "$openbao_code" in
    200|429|472|473|501|503)
      break
      ;;
  esac
  sleep 2
  i=$((i + 1))
done

if [ $i -gt 60 ]; then
  echo "OpenBao did not become ready in time. Start platform-ops local stack first." >&2
  exit 1
fi

case "$openbao_code" in
  200|429|472|473)
    echo "OpenBao is ready"
    ;;
  501)
    echo "OpenBao is uninitialized. Initialize/unseal it from platform-ops first." >&2
    exit 1
    ;;
  503)
    echo "OpenBao is sealed. Unseal it from platform-ops first." >&2
    exit 1
    ;;
  *)
    echo "Unexpected OpenBao health status: $openbao_code" >&2
    exit 1
    ;;
esac

secret_url="$OPENBAO_LOCAL_ADDR/v1/${OPENBAO_KV_MOUNT}/data/${OPENBAO_SECRET_PATH}"
secret_body_file="$(mktemp)"
trap 'rm -f "$secret_body_file"' EXIT

secret_code="$(curl -s -o "$secret_body_file" -w '%{http_code}' -H "X-Vault-Token: $openbao_token" "$secret_url" || true)"
if [ "$secret_code" != "200" ]; then
  echo "OpenBao secret path is not readable with OPENBAO_TOKEN (status=$secret_code): ${OPENBAO_KV_MOUNT}/${OPENBAO_SECRET_PATH}" >&2
  cat "$secret_body_file" >&2 || true
  echo >&2
  echo "Create/fix the secret path in OpenBao and retry." >&2
  exit 1
fi

REQUIRED_KEYS="$required_keys" SECRET_BODY_FILE="$secret_body_file" node -e '
const fs = require("node:fs");
const required = process.env.REQUIRED_KEYS
  .split(",")
  .map((key) => key.trim())
  .filter(Boolean);
let payload;
try {
  payload = JSON.parse(fs.readFileSync(process.env.SECRET_BODY_FILE, "utf8"));
} catch (error) {
  console.error("Failed to parse OpenBao secret payload:", error.message);
  process.exit(1);
}
const data = payload?.data?.data;
if (!data || typeof data !== "object" || Array.isArray(data)) {
  console.error("OpenBao payload does not contain kv-v2 data.data object");
  process.exit(1);
}
const missing = required.filter((key) => {
  const value = data[key];
  return value === undefined || value === null || String(value).trim().length === 0;
});
if (missing.length > 0) {
  console.error(`OpenBao secret path is missing required keys: ${missing.join(", ")}`);
  process.exit(1);
}
'

postgres_password="$(
  SECRET_BODY_FILE="$secret_body_file" node -e '
const fs = require("node:fs");
const payload = JSON.parse(fs.readFileSync(process.env.SECRET_BODY_FILE, "utf8"));
process.stdout.write(String(payload.data.data.POSTGRES_PASSWORD));
'
)"

export POSTGRES_PASSWORD="$postgres_password"

docker network create platform_ops_shared >/dev/null 2>&1 || true
if [ -n "$tolgee_project_id" ]; then
  pull_tolgee_messages "$tolgee_project_id"
fi

docker compose --env-file "${APP_ENV_FILE}" -f docker/compose.app.local.yml up -d --build
