#!/usr/bin/env bash
set -euo pipefail

ENV="${ENV:-sandbox}"
BASE="${BASE_URL:-http://localhost:3000}"

if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"

  PATH_LIST="${MONOOVA_PATH_ACCOUNT_LIST:-/maccount/v1/listasissuer}"
  [[ "${DEBUG:-0}" == "1" ]] && echo -e "\nGET ${BASE_UP}${PATH_LIST}\n" 1>&2

  curl -sS -u "$USER:$PASS" "${BASE_UP}${PATH_LIST}" | jq .
else
  # Local proxy route (GET /api/monoova/account)
  curl -sS "${BASE}/api/monoova/account?env=${ENV}" | jq .
fi