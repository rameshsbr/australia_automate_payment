#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3000}"
ENVQ="${ENV:-sandbox}"
SERVICE="${SERVICE:-notification}"
API_KEY="${API_KEY:-test_sandbox_key}"

curl -sS "${BASE}/api/manage/subscriptions?env=${ENVQ}&service=${SERVICE}" \
  -H "x-api-key: ${API_KEY}" | jq .
