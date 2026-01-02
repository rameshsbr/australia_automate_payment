#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3000}"
curl -sS "$BASE/api/webhooks/list?limit=50" \
  | jq -r '.rows[] | [.id,.kind,.verified,.receivedAt] | @tsv'