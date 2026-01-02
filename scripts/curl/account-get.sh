#!/usr/bin/env bash
set -euo pipefail

MACCT="${1:?usage: account-get.sh <mAccount>}"
ENV="${ENV:-sandbox}"
BASE="${BASE_URL:-http://localhost:3000}"

json_or_raw() { jq . 2>/dev/null || cat; }

if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"

  TMPL="${MONOOVA_PATH_ACCOUNT_GET:-/maccount/v1/get/{mAccount}}"

  # Replace and sanitise accidental trailing brace(s)
  PATH_GET="${TMPL/\{mAccount\}/$MACCT}"
  PATH_GET="$(printf '%s' "$PATH_GET" | sed 's/}$//')"   # drop a lone trailing }
  # Guard: no leftover braces allowed
  if [[ "$PATH_GET" == *"{"* || "$PATH_GET" == *"}"* ]]; then
    echo "Bad template for MONOOVA_PATH_ACCOUNT_GET='$TMPL' → '$PATH_GET' (has unmatched braces)" >&2
    exit 2
  fi

  [[ "${DEBUG:-0}" == "1" ]] && echo -e "\nGET ${BASE_UP}${PATH_GET}\n" 1>&2
  curl -sS -u "$USER:$PASS" "${BASE_UP}${PATH_GET}" | json_or_raw
else
  curl -sS "${BASE}/api/monoova/account/${MACCT}?env=${ENV}" | json_or_raw
fi