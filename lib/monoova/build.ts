type PaymentSource = "mAccount" | "mWallet" | "directDebit" | "token";
type DisbursementMethod =
  | "directcredit"
  | "nppcreditbankaccount"
  | "nppcreditpayid"
  | "bpay"
  | "mAccount"
  | "token";

export type FinancialForm = {
  totalAmount: number | string;
  paymentSource: PaymentSource;
  uniqueReference: string;
  description?: string;
  mAccountToken?: string;
  mWalletToken?: string;
  mWalletPin?: string;
  sourceToken?: string;
  directDebit?: Record<string, any>;
  disbursements: Array<{
    method: DisbursementMethod;
    amount: number | string;
    description?: string;
    toDirectCreditDetails?: Record<string, any>;
    toNppCreditBankAccountDetails?: Record<string, any>;
    toNppCreditPayIdDetails?: Record<string, any>;
    toBPayDetails?: Record<string, any>;
    toMAccount?: string;
    toToken?: string;
  }>;
};

export function buildFinancialRequest(form: FinancialForm): any {
  const disbursements = form.disbursements.map((d) => {
    const base: Record<string, any> = {
      disbursementMethod: d.method,
      amount: Number(d.amount),
      description: d.description || undefined,
    };

    if (d.method === "directcredit" && d.toDirectCreditDetails) {
      base.toDirectCreditDetails = d.toDirectCreditDetails;
    }
    if (d.method === "nppcreditbankaccount" && d.toNppCreditBankAccountDetails) {
      base.toNppCreditBankAccountDetails = d.toNppCreditBankAccountDetails;
    }
    if (d.method === "nppcreditpayid" && d.toNppCreditPayIdDetails) {
      base.toNppCreditPayIdDetails = d.toNppCreditPayIdDetails;
    }
    if (d.method === "bpay" && d.toBPayDetails) {
      base.toBPayDetails = d.toBPayDetails;
    }
    if (d.method === "mAccount" && d.toMAccount) {
      base.toMAccount = d.toMAccount;
    }
    if (d.method === "token" && d.toToken) {
      base.toToken = d.toToken;
    }

    return base;
  });

  const payload: any = {
    totalAmount: Number(form.totalAmount),
    paymentSource: form.paymentSource,
    uniqueReference: form.uniqueReference,
    description: form.description || undefined,
    disbursements,
  };

  if (form.paymentSource === "mAccount" && form.mAccountToken) {
    payload.mAccount = { token: form.mAccountToken };
  }

  if (form.paymentSource === "mWallet" && form.mWalletToken && form.mWalletPin) {
    payload.mWallet = { token: form.mWalletToken, pin: form.mWalletPin };
  }

  if (form.paymentSource === "token" && form.sourceToken) {
    payload.token = form.sourceToken;
  }

  if (form.paymentSource === "directDebit" && form.directDebit) {
    payload.directDebit = form.directDebit;
  }

  return payload;
}
