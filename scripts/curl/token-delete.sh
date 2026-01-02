#!/usr/bin/env bash
set -euo pipefail
TKN="${1:?usage: token-delete.sh <token>}"
ENV="${ENV:-sandbox}"
json_or_raw(){ jq . 2>/dev/null || cat; }

[[ "${FORCE:-0}" == "1" ]] || { echo "Refusing to DELETE token without FORCE=1"; exit 3; }

if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"
  TMPL="${MONOOVA_PATH_TOKEN_DELETE:-/token/v1/delete/{token}}"
  if [[ "$TMPL" == *"{token}"* ]]; then
    PATH_DEL="${TMPL/\{token\}/$TKN}"; PATH_DEL="${PATH_DEL%%\}}"
    [[ "${DEBUG:-0}" == "1" ]] && echo -e "\nGET ${BASE_UP}${PATH_DEL}\n" 1>&2
    curl -sS -u "$USER:$PASS" "${BASE_UP}${PATH_DEL}" | json_or_raw
  else
    BODY="$(jq -n --arg t "$TKN" '{token:$t}')"
    [[ "${DEBUG:-0}" == "1" ]] && { echo -e "\nPOST ${BASE_UP}${TMPL}"; echo "$BODY" | jq .; echo; } 1>&2
    curl -sS -u "$USER:$PASS" -H "Content-Type: application/json" -d "$BODY" "${BASE_UP}${TMPL}" | json_or_raw
  fi
else
  curl -sS -X DELETE "http://localhost:3000/api/monoova/token/item/${TKN}?env=${ENV}" | json_or_raw
fi