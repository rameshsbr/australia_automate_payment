#!/usr/bin/env bash
set -euo pipefail
TKN="${1:?usage: token-update.sh <token> <body.json>}"
BODY_FILE="${2:?usage: token-update.sh <token> <body.json>}"
ENV="${ENV:-sandbox}"
json_or_raw(){ jq . 2>/dev/null || cat; }

[[ "${FORCE:-0}" == "1" ]] || { echo "Refusing to UPDATE token without FORCE=1"; exit 3; }

if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"
  PATH_UPDATE="${MONOOVA_PATH_TOKEN_UPDATE:-/token/v1/update}"
  BODY="$(jq --arg token "$TKN" '.token=$token' "$BODY_FILE")"
  [[ "${DEBUG:-0}" == "1" ]] && { echo -e "\nPOST ${BASE_UP}${PATH_UPDATE}"; echo "$BODY" | jq .; echo; } 1>&2
  curl -sS -u "$USER:$PASS" -H "Content-Type: application/json" -d "$BODY" "${BASE_UP}${PATH_UPDATE}" | json_or_raw
else
  curl -sS -X PATCH -H "Content-Type: application/json" -d @"${BODY_FILE}" \
    "http://localhost:3000/api/monoova/token/item/${TKN}?env=${ENV}" | json_or_raw
fi