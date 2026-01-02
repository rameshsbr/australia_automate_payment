#!/usr/bin/env bash
set -euo pipefail

BODY_FILE="${1:?usage: account-create.sh <body.json>}"
ENV="${ENV:-sandbox}"

[[ "${FORCE:-0}" == "1" ]] || { echo "Refusing to call CREATE without FORCE=1"; exit 3; }

BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
[[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"

PATH_CREATE="${MONOOVA_PATH_ACCOUNT_CREATE:-/maccount/v1/create}"
[[ "${DEBUG:-0}" == "1" ]] && { echo -e "\nPOST ${BASE_UP}${PATH_CREATE}"; cat "$BODY_FILE" | jq .; echo; } 1>&2

curl -sS -u "$USER:$PASS" -H "Content-Type: application/json" \
     -d @"${BODY_FILE}" "${BASE_UP}${PATH_CREATE}" | jq .