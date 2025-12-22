#!/usr/bin/env bash
set -euo pipefail

ENV_COOKIE=${ENV_COOKIE:-SANDBOX}
BASE=${BASE:-http://localhost:3000/api/monoova}
START=${1:-2024-01-01}
END=${2:-2024-01-02}

curl -sS "$BASE/financial/reports/uncleared/$START/$END" \
  -H "Cookie: env=$ENV_COOKIE"
