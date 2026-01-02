#!/usr/bin/env bash
set -euo pipefail
ENV="${ENV:-sandbox}"
BASE="${BASE_URL:-http://localhost:3000}"

if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"
  PATH_SEC="${MONOOVA_PATH_SECURITY_CREATE_TOKEN:-/maccount/v1/createSecurityToken}"
  [[ "${DEBUG:-0}" == "1" ]] && echo -e "\nGET ${BASE_UP}${PATH_SEC}\n" 1>&2
  curl -sS -u "$USER:$PASS" "${BASE_UP}${PATH_SEC}" | jq .
else
  curl -sS "${BASE}/api/monoova/security/oneshot?env=${ENV}" | jq .
fi