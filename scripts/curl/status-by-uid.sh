#!/usr/bin/env bash
set -euo pipefail

ENV_COOKIE=${ENV_COOKIE:-SANDBOX}
BASE=${BASE:-http://localhost:3000/api/monoova}
UID=${1:-demo-uid}

curl -sS "$BASE/financial/status/$UID" \
  -H "Cookie: env=$ENV_COOKIE"
