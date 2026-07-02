#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="docker/.env.app.local"

if [[ -f "${ENV_FILE}" ]]; then
  docker compose --env-file "${ENV_FILE}" -f docker/compose.app.local.yml down -v --remove-orphans
else
  docker compose -f docker/compose.app.local.yml down -v --remove-orphans
fi

bash ./scripts/local-stack-up.sh
