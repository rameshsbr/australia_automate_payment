// lib/monoova/paths.ts

export const P_FINANCIAL_VALIDATE = "/financial/v2/transaction/validate";
export const P_FINANCIAL_EXECUTE  = "/financial/v2/transaction/execute";
export const P_FINANCIAL_STATUS   = "/financial/v2/transaction/status";           // + /{uid} or /{start}/{end}
export const P_FINANCIAL_UNCLEARED = "/financial/v2/transaction/reports/uncleared"; // + /{start}/{end}

export const P_PUBLIC_PING = "/public/v1/ping";

// ✅ Correct public endpoints
export const P_PUBLIC_WEBHOOK_CERT =
  process.env.MONOOVA_PATH_PUBLIC_WEBHOOK_CERT ?? "/public/v1/webhookSigningCertificate";

export const P_PUBLIC_PUBLIC_KEY =
  process.env.MONOOVA_PATH_PUBLIC_KEY ?? "/public/v1/publicKey";

// Optional BPAY lookups (uncomment if needed by UI and available upstream)
// export const P_BPAY_BILLERS = "/bpay/v1/billers";
// export const P_BPAY_BILLER  = "/bpay/v1/biller";

export const notificationPaths = {
  list: "/au/core/notification-v1/Subscription",
  byId: (id: string) => `/au/core/notification-v1/Subscription/${encodeURIComponent(id)}`,
};