#!/usr/bin/env bash
set -euo pipefail

MACCT="${1:?usage: account-txs-range.sh <mAccount> <YYYY-MM-DD> <YYYY-MM-DD> [credit|debit] [pageSize] [cursor]}"
START="${2:?start date YYYY-MM-DD}"
END="${3:?end date YYYY-MM-DD}"
DIR="${4:-}"
SIZE="${5:-}"
CURSOR="${6:-}"
ENV="${ENV:-sandbox}"
BASE="${BASE_URL:-http://localhost:3000}"

json_or_raw() { jq . 2>/dev/null || cat; }

if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"

  PATH_TXNS="${MONOOVA_PATH_ACCOUNT_TXNS:-/maccount/v1/transactions}"

  BODY=$(jq -n \
    --arg acc "$MACCT" \
    --arg s "$START" \
    --arg e "$END" \
    --arg dir "$DIR" \
    --arg size "$SIZE" \
    --arg cur "$CURSOR" '
      {
        accountnumber: $acc,
        frequency: "custom",
        startdate: $s,
        enddate: $e
      }
      | (if ($dir|length)>0 then .direction = $dir else . end)
      | (if ($size|length)>0 then .pageSize = ($size|tonumber) else . end)
      | (if ($cur|length)>0 then .cursor = $cur else . end)
    ')

  [[ "${DEBUG:-0}" == "1" ]] && { echo -e "\nPOST ${BASE_UP}${PATH_TXNS}"; echo "$BODY" | jq .; echo; } 1>&2
  curl -sS -u "$USER:$PASS" -H "Content-Type: application/json" \
       -d "$BODY" "${BASE_UP}${PATH_TXNS}" | json_or_raw
else
  QS="from=$START&to=$END"
  [[ -n "$DIR"   ]] && QS="$QS&direction=$DIR"
  [[ -n "$SIZE"  ]] && QS="$QS&pageSize=$SIZE"
  [[ -n "$CURSOR" ]] && QS="$QS&cursor=$CURSOR"
  curl -sS "${BASE}/api/monoova/account/${MACCT}/transactions/${START}/${END}?env=${ENV}&$QS" | json_or_raw
fi