#!/usr/bin/env bash
set -euo pipefail

MACCT="${1:?usage: account-close.sh <mAccount>}"
ENV="${ENV:-sandbox}"

json_or_raw() { jq . 2>/dev/null || cat; }

[[ "${FORCE:-0}" == "1" ]] || { echo "Refusing to call CLOSE without FORCE=1"; exit 3; }

BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
[[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"

PATH_TMPL="${MONOOVA_PATH_ACCOUNT_CLOSE:-/maccount/v1/close/{mAccount}}"
if [[ "$PATH_TMPL" == *"{mAccount}"* ]]; then
  PATH_CLOSE="${PATH_TMPL/\{mAccount\}/$MACCT}"
  PATH_CLOSE="$(printf '%s' "$PATH_CLOSE" | sed 's/}$//')"
  if [[ "$PATH_CLOSE" == *"{"* || "$PATH_CLOSE" == *"}"* ]]; then
    echo "Bad template for MONOOVA_PATH_ACCOUNT_CLOSE='$PATH_TMPL' → '$PATH_CLOSE' (has unmatched braces)" >&2
    exit 2
  fi
  [[ "${DEBUG:-0}" == "1" ]] && echo -e "\nGET ${BASE_UP}${PATH_CLOSE}\n" 1>&2
  curl -sS -u "$USER:$PASS" "${BASE_UP}${PATH_CLOSE}" | json_or_raw
else
  BODY="$(jq -n --arg m "$MACCT" '{mAccount:$m}')"
  [[ "${DEBUG:-0}" == "1" ]] && { echo -e "\nPOST ${BASE_UP}${PATH_TMPL}"; echo "$BODY" | jq .; echo; } 1>&2
  curl -sS -u "$USER:$PASS" -H "Content-Type: application/json" \
       -d "$BODY" "${BASE_UP}${PATH_TMPL}" | json_or_raw
fi