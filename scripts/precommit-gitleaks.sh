#!/usr/bin/env bash
set -euo pipefail

mkdir -p artifacts

if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --source . --no-git --redact --config .gitleaks.toml --report-format json --report-path artifacts/gitleaks-report.json
else
  docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:v8.24.2 detect --source /repo --no-git --redact --config /repo/.gitleaks.toml --report-format json --report-path /repo/artifacts/gitleaks-report.json
fi
