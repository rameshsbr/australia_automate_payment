#!/usr/bin/env bash
set -euo pipefail
MACCT="${1:?usage: token-list.sh <mAccount>}"
ENV="${ENV:-sandbox}"
BASE="${BASE_URL:-http://localhost:3000}"
if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"
  TMPL="${MONOOVA_PATH_TOKEN_LIST:-/token/v1/list/{mAccount}}"
  PATH_LIST="${TMPL/\{mAccount\}/$MACCT}"; PATH_LIST="${PATH_LIST%%\}}"
  [[ "${DEBUG:-0}" == "1" ]] && echo -e "\nGET ${BASE_UP}${PATH_LIST}\n" 1>&2
  curl -sS -u "$USER:$PASS" "${BASE_UP}${PATH_LIST}" | jq .
else
  curl -sS "${BASE}/api/monoova/token/${MACCT}/list?env=${ENV}" | jq .
fi