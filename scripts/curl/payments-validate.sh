#!/usr/bin/env bash
set -euo pipefail

ENV_COOKIE=${ENV_COOKIE:-SANDBOX}
BASE=${BASE:-http://localhost:3000/api/monoova}

BODY='{
  "totalAmount": 1.23,
  "paymentSource": "mAccount",
  "mAccount": { "token": "6279059743697945" },
  "uniqueReference": "curl-validate-demo",
  "disbursements": [
    {
      "disbursementMethod": "directcredit",
      "amount": 1.23,
      "toDirectCreditDetails": {
        "bsbNumber": "062000",
        "accountNumber": "12345678",
        "accountName": "Demo"
      }
    }
  ]
}'

curl -sS -X POST "$BASE/financial/validate" \
  -H "content-type: application/json" \
  -H "Cookie: env=$ENV_COOKIE" \
  -d "$BODY"
