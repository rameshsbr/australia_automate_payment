#!/usr/bin/env bash
set -euo pipefail
BODY_FILE="${1:?usage: token-create-au.sh <body.json> <mAccount>}"
MACCT="${2:-${SANDBOX_MACCOUNT:-}}"
ENV="${ENV:-sandbox}"
json_or_raw(){ jq . 2>/dev/null || cat; }

if [[ -z "${MACCT}" ]]; then
  echo "usage: token-create-au.sh <body.json> <mAccount>"; exit 2
fi

if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"
  PATH_CREATE="${MONOOVA_PATH_TOKEN_CREATE_AU_BANK:-/token/v1/createAustralianBankAccount}"
  [[ "${DEBUG:-0}" == "1" ]] && { echo -e "\nPOST ${BASE_UP}${PATH_CREATE}"; cat "$BODY_FILE" | jq .; echo; } 1>&2
  curl -sS -u "$USER:$PASS" -H "Content-Type: application/json" -d @"${BODY_FILE}" "${BASE_UP}${PATH_CREATE}" | json_or_raw
else
  curl -sS -H "Content-Type: application/json" -d @"${BODY_FILE}" \
    "http://localhost:3000/api/monoova/token/accounts-create-au/${MACCT}?env=${ENV}" | json_or_raw
fi