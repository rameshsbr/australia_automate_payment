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
    payIdType: "Email" | "Phone" | "ABN" | "OrganisationId" | "OrgId";
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

export type RailId =
  | "DE_DIRECT_CREDIT"
  | "DE_DIRECT_CREDIT_TOKEN"
  // | "DE_DIRECT_DEBIT"
  // | "DE_DIRECT_DEBIT_TOKEN"
  | "NPP_BANK"
  | "NPP_PAYID"
  | "BPAY"
  | "CHILD_PAY"
  | "CHILD_DEBIT";

export const PAYMENT_RAILS: { id: RailId; label: string }[] = [
  { id: "DE_DIRECT_CREDIT", label: "Direct Credit (DE)" },
  { id: "DE_DIRECT_CREDIT_TOKEN", label: "Direct Credit (Token)" },
  // { id: "DE_DIRECT_DEBIT", label: "Direct Debit (DE)" },
  // { id: "DE_DIRECT_DEBIT_TOKEN", label: "Direct Debit (Token)" },
  { id: "NPP_BANK", label: "NPP – Bank Account" },
  { id: "NPP_PAYID", label: "NPP – PayID" },
  { id: "BPAY", label: "BPAY" },
  { id: "CHILD_PAY", label: "Pay Child mAccount" },
  { id: "CHILD_DEBIT", label: "Debit Child mAccount" },
];

export type FormValues = {
  rail: RailId;
  amount: string;
  currency: "AUD";
  bsb?: string;
  accountNumber?: string;
  accountName?: string;
  lodgementReference?: string;
  storedToken?: string;
  payId?: string;
  payIdType?: "Email" | "Phone" | "ABN" | "OrgId";
  billerCode?: string;
  crn?: string;
  childMaccount?: string;
};

export function buildMonoovaSinglePaymentBody(v: FormValues) {
  const base = {
    callerUniqueReference: crypto.randomUUID(),
    source: { type: "mAccount" as const },
  };

  const amt = v.amount;
  const cur = v.currency;

  switch (v.rail) {
    case "DE_DIRECT_CREDIT":
      return {
        ...base,
        disbursements: [
          {
            type: "DE",
            disbursementMethod: "DirectCredit",
            amount: amt,
            currency: cur,
            toDirectCreditDetails: {
              bsbNumber: v.bsb,
              accountNumber: v.accountNumber,
              accountName: v.accountName,
              lodgementReference: v.lodgementReference,
            },
          },
        ],
      };

    case "DE_DIRECT_CREDIT_TOKEN":
      return {
        ...base,
        disbursements: [
          {
            type: "DE",
            disbursementMethod: "DirectCredit",
            amount: amt,
            currency: cur,
            toDirectCreditUsingTokenDetails: {
              token: v.storedToken,
            },
          },
        ],
      };

    case "NPP_BANK":
      return {
        ...base,
        disbursements: [
          {
            type: "DE",
            amount: amt,
            currency: cur,
            toNppBankAccountDetails: {
              bsbNumber: v.bsb,
              accountNumber: v.accountNumber,
              accountName: v.accountName,
              lodgementReference: v.lodgementReference,
            },
          },
        ],
      };

    case "NPP_PAYID":
      return {
        ...base,
        disbursements: [
          {
            type: "DE",
            amount: amt,
            currency: cur,
            toNppPayIdDetails: {
              payId: v.payId,
              payIdType: v.payIdType,
              remitterName: v.accountName,
              lodgementReference: v.lodgementReference,
            },
          },
        ],
      };

    case "BPAY":
      return {
        ...base,
        disbursements: [
          {
            type: "DE",
            amount: amt,
            currency: cur,
            toBpayDetails: {
              billerCode: v.billerCode,
              crn: v.crn,
              billerName: v.accountName,
            },
          },
        ],
      };

    case "CHILD_PAY":
      return {
        ...base,
        disbursements: [
          {
            type: "DE",
            amount: amt,
            currency: cur,
            toChildMaccountDetails: {
              mAccountNumber: v.childMaccount,
            },
          },
        ],
      };

    case "CHILD_DEBIT":
      return {
        ...base,
        disbursements: [
          {
            type: "DE",
            amount: amt,
            currency: cur,
            fromChildMaccountDetails: {
              mAccountNumber: v.childMaccount,
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown rail: ${v.rail}`);
  }
}

export const RAIL_FIELD_GROUPS: Record<
  RailId,
  Array<"deBank" | "token" | "payId" | "bpay" | "child">
> = {
  DE_DIRECT_CREDIT: ["deBank"],
  DE_DIRECT_CREDIT_TOKEN: ["token"],
  // DE_DIRECT_DEBIT: ["deBank"],
  // DE_DIRECT_DEBIT_TOKEN: ["token"],
  NPP_BANK: ["deBank"],
  NPP_PAYID: ["payId"],
  BPAY: ["bpay"],
  CHILD_PAY: ["child"],
  CHILD_DEBIT: ["child"],
};
