#!/usr/bin/env bash
set -euo pipefail

MACCT="${1:?usage: account-send-statement.sh <mAccount> <body.json>}"
BODY_FILE="${2:?usage: account-send-statement.sh <mAccount> <body.json>}"
ENV="${ENV:-sandbox}"

[[ "${FORCE:-0}" == "1" ]] || { echo "Refusing to call SEND STATEMENT without FORCE=1"; exit 3; }

BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
[[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"

PATH_STMT="${MONOOVA_PATH_ACCOUNT_STATEMENT:-/maccount/v1/sendstatement}"

# Merge fields: ensure both accountnumber & mAccount; support email/toEmail and from/to aliases.
BODY="$(jq \
  --arg acc "$MACCT" \
  '
    . as $in
    | {
        mAccount: $acc,
        accountnumber: $acc,
        email: ($in.email // $in.toEmail),
        toEmail: ($in.toEmail // $in.email),
        statementFromDate: ($in.statementFromDate // $in.fromDate),
        statementToDate: ($in.statementToDate // $in.toDate),
        format: $in.format
      } * $in
  ' "$BODY_FILE")"

[[ "${DEBUG:-0}" == "1" ]] && { echo -e "\nPOST ${BASE_UP}${PATH_STMT}"; echo "$BODY" | jq .; echo; } 1>&2
curl -sS -u "$USER:$PASS" -H "Content-Type: application/json" -d "$BODY" "${BASE_UP}${PATH_STMT}" | jq .