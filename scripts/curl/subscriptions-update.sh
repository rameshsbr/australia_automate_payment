#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3000}"
ENVQ="${ENV:-sandbox}"
API_KEY="${API_KEY:-test_sandbox_key}"
IDEMP="${IDEMPOTENCY_KEY:-$(uuidgen 2>/dev/null || echo $RANDOM$RANDOM)}"
ID="${1:-}"

if [ -z "$ID" ]; then echo "Usage: $0 <subscriptionId>"; exit 1; fi

cat <<'JSON' >/tmp/sub-update.json
{
  "subscriptionName": "Demo Sub (updated)",
  "eventName": "paymentagreementnotification",
  "callbackUrl": "https://example.com/webhooks/monoova",
  "isActive": true,
  "emailBcc": ["audit@example.com"]
}
JSON

curl -sS -X PUT "${BASE}/api/manage/subscriptions?env=${ENVQ}&id=${ID}" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${IDEMP}" \
  -d @/tmp/sub-update.json | jq .
