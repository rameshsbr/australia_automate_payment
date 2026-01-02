#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3000}"
ENVQ="${ENV:-sandbox}"
API_KEY="${API_KEY:-test_sandbox_key}"
IDEMP="${IDEMPOTENCY_KEY:-$(uuidgen 2>/dev/null || echo $RANDOM$RANDOM)}"

cat <<'JSON' >/tmp/sub-create.json
{
  "subscriptionName": "Demo Sub",
  "eventName": "paymentagreementnotification",
  "callbackUrl": "https://example.com/webhooks/monoova",
  "isActive": true,
  "emailTo": ["ops@example.com"]
}
JSON

curl -sS -X POST "${BASE}/api/manage/subscriptions?env=${ENVQ}" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${IDEMP}" \
  -d @/tmp/sub-create.json | jq .
