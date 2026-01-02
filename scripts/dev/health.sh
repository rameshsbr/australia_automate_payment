#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3000}"
curl -sS "$BASE/api/dev/health" | jq .