#!/usr/bin/env bash
set -euo pipefail

START="${1:?usage: receivables-payto.sh <YYYY-MM-DD> <YYYY-MM-DD>}"
END="${2:?usage: receivables-payto.sh <YYYY-MM-DD> <YYYY-MM-DD>}"
ENV="${ENV:-sandbox}"
BASE="${BASE_URL:-http://localhost:3000}"

build_path() {
  local tmpl="$1" s="$2" e="$3"
  local p
  p="$(printf '%s' "$tmpl" | sed -E "s#\{startDate\}#${s}#g; s#\{endDate\}#${e}#g")"
  p="${p%%\}}"
  printf '%s' "$p"
}

normalize_dupe_end() {
  local path="$1"
  local a="${path%/}"
  local last="${a##*/}"
  local prev="${a%/*}"; prev="${prev##*/}"
  [[ "$last" == "$prev" ]] && printf '%s' "${a%/*}" || printf '%s' "$a"
}

if [[ "${DIRECT:-0}" == "1" ]]; then
  BASE_UP="${MONOOVA_BASE_SANDBOX:?}"; USER="${SANDBOX_MACCOUNT:?}"; PASS="${MONOOVA_API_KEY_SANDBOX:?}"
  [[ "$ENV" == "live" ]] && BASE_UP="${MONOOVA_BASE_LIVE:?}" USER="${LIVE_MACCOUNT:?}" PASS="${MONOOVA_API_KEY_LIVE:?}"

  TMPL="${MONOOVA_PATH_REPORT_RECEIVABLES_PAYTO:-/receivables/v1/payto/{startDate}/{endDate}}"
  PATH_RPT="$(build_path "$TMPL" "$START" "$END")"
  PATH_RPT="$(normalize_dupe_end "$PATH_RPT")"

  if [[ "$PATH_RPT" == *'{'* || "$PATH_RPT" == *'}'* ]]; then
    echo "Receivables path template appears malformed after substitution: [$PATH_RPT]" >&2
    exit 2
  fi

  [[ "${DEBUG:-0}" == "1" ]] && echo -e "\nGET ${BASE_UP}${PATH_RPT}\n" 1>&2
  curl -sS -u "$USER:$PASS" "${BASE_UP}${PATH_RPT}" | jq .
else
  curl -sS "${BASE}/api/monoova/financial/reports/receivables/payto/${START}/${END}?env=${ENV}" | jq .
fi