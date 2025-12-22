export const P_FINANCIAL_VALIDATE = "/financial/v2/transaction/validate";
export const P_FINANCIAL_EXECUTE = "/financial/v2/transaction/execute";
export const P_FINANCIAL_STATUS = "/financial/v2/transaction/status"; // + /{uid} or /{start}/{end}
export const P_FINANCIAL_UNCLEARED = "/financial/v2/transaction/reports/uncleared"; // + /{start}/{end}

export const P_PUBLIC_PING = "/public/v1/ping";

// Optional BPAY lookups (uncomment if needed by UI and available upstream)
// export const P_BPAY_BILLERS = "/bpay/v1/billers";
// export const P_BPAY_BILLER = "/bpay/v1/biller";
