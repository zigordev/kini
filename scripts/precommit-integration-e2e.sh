#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker/compose.ci.yml"
COMPOSE_PROJECT="kini-precommit"
export CI_DB_PORT=15435
export CI_API_PORT=3112
export CI_WEB_PORT=3113
export CI_OAUTH_PORT=3911
STARTED_BY_HOOK=0
STACK_SERVICES=(postgres api web)

cleanup() {
  if [ "$STARTED_BY_HOOK" -eq 1 ]; then
    docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

running_container="$(docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" ps -q api 2>/dev/null || true)"
existing_local_stack=0
local_api_container="$(
  docker compose --env-file docker/.env.app.local -f docker/compose.app.local.yml ps -q kini_api 2>/dev/null || true
)"
local_web_container="$(
  docker compose --env-file docker/.env.app.local -f docker/compose.app.local.yml ps -q kini_web 2>/dev/null || true
)"

if [ -n "$local_api_container" ] && [ -n "$local_web_container" ]; then
  existing_local_stack=1
fi

if [ -z "$running_container" ] && [ "$existing_local_stack" -eq 0 ]; then
  docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" up -d --build "${STACK_SERVICES[@]}"
  STARTED_BY_HOOK=1
fi

API_HEALTH_URL="http://localhost:${CI_API_PORT}/health"
METRICS_URL="http://localhost:${CI_API_PORT}/metrics"
WEB_HEALTH_URL="http://localhost:${CI_WEB_PORT}/login"
STACK_LABEL="the throwaway precommit stack (${COMPOSE_PROJECT})"
STACK_COMPOSE=(docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE")
API_LOG_SERVICES=(api)
WEB_LOG_SERVICES=(web api)

if [ "$existing_local_stack" -eq 1 ]; then
  API_HEALTH_URL="http://localhost:3012/health"
  METRICS_URL="http://localhost:3012/metrics"
  WEB_HEALTH_URL="http://localhost:3013/login"
  STACK_LABEL="the local stack that was already running"
  STACK_COMPOSE=(docker compose --env-file docker/.env.app.local -f docker/compose.app.local.yml)
  API_LOG_SERVICES=(kini_api)
  WEB_LOG_SERVICES=(kini_web kini_api)
fi

ATTEMPTS=60
DELAY=2
ATTEMPT_TIMEOUT=10

wait_for_http() {
  local label="$1" url="$2"
  local attempt=1 status=0 error='' first_error='' error_varied=0

  echo "Waiting for ${label} at ${url} (up to ${ATTEMPTS} tries, ${DELAY}s apart)..."
  while [ "$attempt" -le "$ATTEMPTS" ]; do
    status=0
    error="$(curl -fsS --max-time "$ATTEMPT_TIMEOUT" "$url" 2>&1 >/dev/null)" || status=$?
    if [ "$status" -eq 0 ]; then
      echo "${label} answered on try ${attempt}"
      return 0
    fi
    error="${error:-curl exited ${status} without saying why}"
    if [ -z "$first_error" ]; then
      first_error="$error"
    elif [ "$error" != "$first_error" ]; then
      error_varied=1
    fi
    printf 'try %d/%d: %s\n' "$attempt" "$ATTEMPTS" "$error" >&2
    sleep "$DELAY"
    attempt=$((attempt + 1))
  done

  {
    echo "${label} never answered."
    echo "  tried:      GET ${url}"
    echo "  stack:      ${STACK_LABEL}"
    echo "  tries:      ${ATTEMPTS}, ${DELAY}s apart, ${ATTEMPT_TIMEOUT}s timeout each"
    echo "  last error: ${error} (curl exit ${status})"
    if [ "$error_varied" -eq 0 ]; then
      echo "  all ${ATTEMPTS} tries failed the same way, so this is not a slow start"
    else
      echo "  first error: ${first_error}"
      echo "  the error changed while waiting; compare the first and last to see how far it got"
    fi
  } >&2
  return 1
}

dump_stack_logs() {
  echo "Last 200 log lines from ${STACK_LABEL}:" >&2
  "${STACK_COMPOSE[@]}" logs --no-color --tail 200 "$@" >&2 || true
}

if ! wait_for_http "API health" "$API_HEALTH_URL"; then
  dump_stack_logs "${API_LOG_SERVICES[@]}"
  exit 1
fi

metrics_payload="$(curl -fsS --max-time "$ATTEMPT_TIMEOUT" "$METRICS_URL")"
for metric in http_requests_total http_request_duration_seconds_bucket; do
  case "$metrics_payload" in
    *"$metric"*) ;;
    *)
      echo "Missing $metric in $METRICS_URL output" >&2
      echo "  the scrape answered with ${#metrics_payload} bytes; the series is not among them" >&2
      exit 1
      ;;
  esac
done

if ! wait_for_http "web health" "$WEB_HEALTH_URL"; then
  dump_stack_logs "${WEB_LOG_SERVICES[@]}"
  exit 1
fi

echo "Precommit integration smoke passed"
