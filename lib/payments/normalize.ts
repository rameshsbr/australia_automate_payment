// lib/payments/normalize.ts
type DirectCreditUI = {
  type: "DE";
  amount: string;
  currency: string;
  details?: {
    bsb?: string;
    bsbNumber?: string;
    accountNumber?: string;
    remitterName?: string;
    reference?: string;
  };
  disbursementMethod?: "DirectCredit" | "DirectDebit";
  toDirectCreditDetails?: {
    bsb?: string;
    bsbNumber?: string;
    accountNumber: string;
    accountName?: string;
    lodgementReference?: string;
  };
  toDirectDebitDetails?: {
    bsbNumber: string;
    accountNumber: string;
    accountName?: string;
  };
  toDirectCreditUsingTokenDetails?: { token: string };
  toDirectDebitUsingTokenDetails?: { token: string };
  toNppBankAccountDetails?: {
    bsbNumber: string;
    accountNumber: string;
    accountName?: string;
    remitterName?: string;
    lodgementReference?: string;
  };
  toNppPayIdDetails?: {
    payId: string;
    payIdType: "Email" | "Phone" | "ABN" | "OrganisationId";
    remitterName?: string;
    lodgementReference?: string;
  };
  toBpayDetails?: {
    billerCode: string;
    crn: string;
    billerName?: string;
  };
  toChildMaccountDetails?: { mAccountNumber: string };
  fromChildMaccountDetails?: { mAccountNumber: string };
};

type DisbursementUI = DirectCreditUI | any;

export type ValidateExecuteUI = {
  callerUniqueReference: string;
  source: { type: "mAccount" } | { type: string; [k: string]: any };
  disbursements: DisbursementUI[];
  totalAmount?: string | number;
};

export function toMonoovaDisbursement(d: DisbursementUI) {
  if (d.type === "DE") {
    if (d.details && !d.toDirectCreditDetails && !d.disbursementMethod) {
      const { bsb, bsbNumber, accountNumber, remitterName, reference } = d.details;
      return {
        type: "DE",
        disbursementMethod: "DirectCredit",
        amount: d.amount,
        currency: d.currency,
        toDirectCreditDetails: {
          bsbNumber: bsbNumber || bsb,
          accountNumber,
          accountName: remitterName,
          lodgementReference: reference,
        },
      };
    }

    return {
      type: "DE",
      disbursementMethod: d.disbursementMethod ?? "DirectCredit",
      amount: d.amount,
      currency: d.currency,
      ...(d.toDirectCreditDetails && { toDirectCreditDetails: d.toDirectCreditDetails }),
      ...(d.toDirectDebitDetails && { toDirectDebitDetails: d.toDirectDebitDetails }),
      ...(d.toDirectCreditUsingTokenDetails && {
        toDirectCreditUsingTokenDetails: d.toDirectCreditUsingTokenDetails,
      }),
      ...(d.toDirectDebitUsingTokenDetails && {
        toDirectDebitUsingTokenDetails: d.toDirectDebitUsingTokenDetails,
      }),
      ...(d.toNppBankAccountDetails && { toNppBankAccountDetails: d.toNppBankAccountDetails }),
      ...(d.toNppPayIdDetails && { toNppPayIdDetails: d.toNppPayIdDetails }),
      ...(d.toBpayDetails && { toBpayDetails: d.toBpayDetails }),
      ...(d.toChildMaccountDetails && { toChildMaccountDetails: d.toChildMaccountDetails }),
      ...(d.fromChildMaccountDetails && { fromChildMaccountDetails: d.fromChildMaccountDetails }),
    };
  }

  return d;
}

export function toMonoovaRequest(body: ValidateExecuteUI) {
  const disbursements = (body.disbursements || []).map(toMonoovaDisbursement);

  return {
    callerUniqueReference: body.callerUniqueReference,
    source: body.source,
    disbursements,
    ...(body.totalAmount ? { totalAmount: Number(body.totalAmount) } : {}),
  };
}
