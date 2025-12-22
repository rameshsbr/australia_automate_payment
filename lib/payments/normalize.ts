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

export type Rail =
  | "de"
  | "de-token"
  | "dd-token"
  | "npp-bank"
  | "npp-payid"
  | "bpay"
  | "child-credit"
  | "child-debit";

export type FormState = {
  callerUniqueReference?: string;
  amount: string | number;
  currency: string;
  rail: Rail;
  bsb?: string;
  accountNumber?: string;
  accountName?: string;
  lodgementReference?: string;
  payId?: string;
  payIdType?: "Email" | "Phone" | "ABN" | "OrgId";
  remitterName?: string;
  storedToken?: string;
  billerCode?: string;
  crn?: string;
  billerName?: string;
  mAccountNumber?: string;
};

const twoDp = (v: string | number) =>
  typeof v === "number" ? v.toFixed(2) : /\./.test(v) ? Number(v).toFixed(2) : `${v}.00`;

export function normalizeSinglePayment(f: FormState) {
  const callerUniqueReference =
    f.callerUniqueReference ||
    (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `web-${Date.now()}`);

  const base = {
    callerUniqueReference,
    source: { type: "mAccount" as const },
    disbursements: [{} as any],
  };

  const d = base.disbursements[0];
  d.type = "DE";
  d.amount = twoDp(f.amount);
  d.currency = f.currency || "AUD";

  switch (f.rail) {
    case "de": {
      d.toDirectCreditDetails = {
        bsbNumber: f.bsb || "",
        bsb: f.bsb || "",
        accountNumber: f.accountNumber || "",
        accountName: f.accountName || "",
        lodgementReference: f.lodgementReference || "",
      };
      break;
    }
    case "de-token": {
      d.toDirectCreditUsingTokenDetails = { token: f.storedToken || "" };
      break;
    }
    case "dd-token": {
      d.toDirectDebitUsingTokenDetails = { token: f.storedToken || "" };
      break;
    }
    case "npp-bank": {
      d.toNppBankAccountDetails = {
        bsbNumber: f.bsb || "",
        accountNumber: f.accountNumber || "",
        accountName: f.accountName || "",
        lodgementReference: f.lodgementReference || "",
      };
      break;
    }
    case "npp-payid": {
      d.toNppPayIdDetails = {
        payId: f.payId || "",
        payIdType: f.payIdType || "Email",
        remitterName: f.remitterName || f.accountName || "",
        lodgementReference: f.lodgementReference || "",
      };
      break;
    }
    case "bpay": {
      d.toBpayDetails = {
        billerCode: f.billerCode || "",
        crn: f.crn || "",
        billerName: f.billerName || "",
      };
      break;
    }
    case "child-credit": {
      d.fromChildMaccountDetails = { mAccountNumber: f.mAccountNumber || "" };
      break;
    }
    case "child-debit": {
      d.toChildMaccountDetails = { mAccountNumber: f.mAccountNumber || "" };
      break;
    }
    default:
      throw new Error(`Unknown rail: ${(f as any).rail}`);
  }

  return base;
}

export const PAYMENT_RAILS: { id: Rail; label: string }[] = [
  { id: "de", label: "Direct Credit (DE)" },
  { id: "de-token", label: "Direct Credit (Token)" },
  { id: "dd-token", label: "Direct Debit (Token)" },
  { id: "npp-bank", label: "NPP – Bank Account" },
  { id: "npp-payid", label: "NPP – PayID" },
  { id: "bpay", label: "BPAY" },
  { id: "child-debit", label: "Pay child mAccount" },
  { id: "child-credit", label: "Debit child mAccount" },
];

export const RAIL_FIELD_GROUPS: Record<
  Rail,
  Array<"deBank" | "token" | "payId" | "bpay" | "child">
> = {
  de: ["deBank"],
  "de-token": ["token"],
  "dd-token": ["token"],
  "npp-bank": ["deBank"],
  "npp-payid": ["payId"],
  bpay: ["bpay"],
  "child-credit": ["child"],
  "child-debit": ["child"],
};
