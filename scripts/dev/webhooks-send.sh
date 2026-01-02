#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3000}"
SECRET="${WEBHOOK_SECRET:?export WEBHOOK_SECRET first}"
KIND="${1:-npppaymentstatus}"
PAYLOAD="${2:-{\"type\":\"$KIND\",\"demo\":true}}"

curl -sS -i -X POST "$BASE/api/webhooks/provider" \
  -H "x-monoova-signature: $SECRET" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"