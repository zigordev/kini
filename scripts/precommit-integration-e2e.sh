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
local_api_container="$(
  docker compose --env-file docker/.env.app.local -f docker/compose.app.local.yml ps -q kini_api 2>/dev/null || true
)"
local_web_container="$(
  docker compose --env-file docker/.env.app.local -f docker/compose.app.local.yml ps -q kini_web 2>/dev/null || true
)"

existing_local_stack=0
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

if [ "$existing_local_stack" -eq 1 ]; then
  API_HEALTH_URL="http://localhost:3012/health"
  METRICS_URL="http://localhost:3012/metrics"
  WEB_HEALTH_URL="http://localhost:3013/login"
fi

wait_for() {
  local url="$1"
  local label="$2"
  local service="$3"
  local attempts=60
  local delay=2
  local i=1
  local started
  started="$(date +%s)"
  local failures=""
  local last_error=""
  local last_status=0

  echo "Waiting for $label..."
  while [ "$i" -le "$attempts" ]; do
    local error=""
    if error="$(curl -fsS -o /dev/null "$url" 2>&1)"; then
      return 0
    else
      last_status=$?
    fi

    last_error="${error:-curl gave no message}"
    printf '  %s attempt %s/%s: curl exit %s: %s\n' \
      "$label" "$i" "$attempts" "$last_status" "$last_error" >&2
    failures="${failures}curl exit ${last_status}: ${last_error}
"

    sleep "$delay"
    i=$((i + 1))
  done

  local elapsed=$(($(date +%s) - started))
  local distinct
  distinct="$(printf '%s' "$failures" | sort -u | wc -l | tr -d ' ')"

  {
    echo "$label did not become reachable in time"
    echo "  tried GET $url $attempts times, ${delay}s apart, over ${elapsed}s"
    echo "  last failure: curl exit ${last_status}: ${last_error}"
    if [ "$distinct" -eq 1 ]; then
      echo "  all $attempts attempts failed identically, so $service never began answering;"
      echo "  this is not a slow start, and the logs below cover the whole wait"
    else
      echo "  the failure changed while waiting, $distinct distinct ones, most frequent first:"
      printf '%s' "$failures" | sort | uniq -c | sort -rn | sed 's/^/    /'
    fi
  } >&2

  docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" logs --no-color "$service"
  exit 1
}

wait_for "$API_HEALTH_URL" "API health" api

metrics_payload="$(curl -fsS "$METRICS_URL")"
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

wait_for "$WEB_HEALTH_URL" "web" web

echo "Precommit integration smoke passed"
