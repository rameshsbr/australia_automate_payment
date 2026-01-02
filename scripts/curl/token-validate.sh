#!/usr/bin/env bash
set -euo pipefail
BODY_FILE="${1:?usage: token-validate.sh <body.json>}"
ENV="${ENV:-sandbox}"
BASE="${BASE_URL:-http://localhost:3000}"
json_or_raw(){ jq . 2>/dev/null || cat; }

if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"
  PATH_VALIDATE="${MONOOVA_PATH_TOKEN_VALIDATE:-/token/v1/validate}"
  [[ "${DEBUG:-0}" == "1" ]] && { echo -e "\nPOST ${BASE_UP}${PATH_VALIDATE}"; cat "$BODY_FILE" | jq .; echo; } 1>&2
  curl -sS -u "$USER:$PASS" -H "Content-Type: application/json" -d @"${BODY_FILE}" "${BASE_UP}${PATH_VALIDATE}" | json_or_raw
else
  curl -sS -H "Content-Type: application/json" -d @"${BODY_FILE}" "${BASE}/api/monoova/token/validate?env=${ENV}" | json_or_raw
fi