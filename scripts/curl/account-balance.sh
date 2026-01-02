#!/usr/bin/env bash
set -euo pipefail

MACCT="${1:?usage: account-balance.sh <mAccount>}"
ENV="${ENV:-sandbox}"
BASE="${BASE_URL:-http://localhost:3000}"

json_or_raw() { jq . 2>/dev/null || cat; }

if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"

  TMPL="${MONOOVA_PATH_ACCOUNT_BALANCE:-/maccount/v1/financials/{mAccount}}"
  PATH_BAL="${TMPL/\{mAccount\}/$MACCT}"
  PATH_BAL="$(printf '%s' "$PATH_BAL" | sed 's/}$//')"
  if [[ "$PATH_BAL" == *"{"* || "$PATH_BAL" == *"}"* ]]; then
    echo "Bad template for MONOOVA_PATH_ACCOUNT_BALANCE='$TMPL' → '$PATH_BAL' (has unmatched braces)" >&2
    exit 2
  fi

  [[ "${DEBUG:-0}" == "1" ]] && echo -e "\nGET ${BASE_UP}${PATH_BAL}\n" 1>&2
  curl -sS -u "$USER:$PASS" "${BASE_UP}${PATH_BAL}" | json_or_raw
else
  curl -sS "${BASE}/api/monoova/account/${MACCT}/balance?env=${ENV}" | json_or_raw
fi