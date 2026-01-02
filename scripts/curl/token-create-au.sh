#!/usr/bin/env bash
set -euo pipefail
BODY_FILE="${1:?usage: token-create-au.sh <body.json>}"
ENV="${ENV:-sandbox}"
BASE="${BASE_URL:-http://localhost:3000}"

if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"
  PATH_CREATE="${MONOOVA_PATH_TOKEN_CREATE_AU_BANK:-/token/v1/createAustralianBankAccount}"
  [[ "${DEBUG:-0}" == "1" ]] && { echo -e "\nPOST ${BASE_UP}${PATH_CREATE}"; cat "$BODY_FILE" | jq .; echo; } 1>&2
  curl -sS -u "$USER:$PASS" -H "Content-Type: application/json" -d @"${BODY_FILE}" "${BASE_UP}${PATH_CREATE}" | jq .
else
  curl -sS -H "Content-Type: application/json" -d @"${BODY_FILE}" "${BASE}/api/monoova/token/create-au?env=${ENV}" | jq .
fi