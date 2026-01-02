#!/usr/bin/env bash
set -euo pipefail
ENV="${ENV:-sandbox}"
BASE="${BASE_URL:-http://localhost:3000}"
curl -sS "${BASE}/api/monoova/public/ping?env=${ENV}" | jq .