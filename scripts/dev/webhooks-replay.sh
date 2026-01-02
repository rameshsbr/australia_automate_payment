#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3000}"
EVENT_ID="${1:?usage: webhooks-replay.sh <eventId> [targetUrl]}"
TARGET_URL="${2:-}"

if [[ -n "$TARGET_URL" ]]; then
  curl -sS -X POST "$BASE/api/webhooks/replay?id=$EVENT_ID" \
    -H "Content-Type: application/json" \
    -d "{\"target\":\"$TARGET_URL\"}" | jq .
else
  curl -sS -X POST "$BASE/api/webhooks/replay?id=$EVENT_ID" | jq .
fi