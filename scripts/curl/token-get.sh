#!/usr/bin/env bash
set -euo pipefail
TKN="${1:?usage: token-get.sh <token>}"
ENV="${ENV:-sandbox}"
json_or_raw(){ jq . 2>/dev/null || cat; }

if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"
  TMPL="${MONOOVA_PATH_TOKEN_GET:-/token/v1/get/{token}}"
  PATH_GET="${TMPL/\{token\}/$TKN}"; PATH_GET="${PATH_GET%%\}}"
  [[ "${DEBUG:-0}" == "1" ]] && echo -e "\nGET ${BASE_UP}${PATH_GET}\n" 1>&2
  curl -sS -u "$USER:$PASS" "${BASE_UP}${PATH_GET}" | json_or_raw
else
  curl -sS "http://localhost:3000/api/monoova/token/item/${TKN}?env=${ENV}" | json_or_raw
fi