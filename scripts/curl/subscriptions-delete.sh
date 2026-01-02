#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3000}"
ENVQ="${ENV:-sandbox}"
API_KEY="${API_KEY:-test_sandbox_key}"
ID="${1:-}"

if [ -z "$ID" ]; then echo "Usage: $0 <subscriptionId>"; exit 1; fi

curl -sS -X DELETE "${BASE}/api/manage/subscriptions?env=${ENVQ}&id=${ID}" \
  -H "x-api-key: ${API_KEY}" -i
