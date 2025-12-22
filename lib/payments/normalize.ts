// lib/payments/normalize.ts
// Canonical Monoova methods are lowercase.
export const METHOD = {
  DIRECT_CREDIT_DE: "directcredit",
  DIRECT_DEBIT: "directdebit",
  TOKEN: "token", // direct credit to a bank-account token
  NPP_BANK: "nppcreditbankaccount",
  NPP_PAYID: "nppcreditpayid",
  BPAY: "bpay",
  PAY_CHILD_MACCOUNT: "paychildmaccount",
  DEBIT_CHILD_MACCOUNT: "debitchildmaccount",
} as const;

export type Rail =
  | "DIRECT_CREDIT_DE"
  | "DIRECT_CREDIT_TOKEN"   // dest token (credit)
  | "DIRECT_DEBIT_TOKEN"    // source token (debit)
  | "NPP_BANK"
  | "NPP_PAYID"
  | "BPAY"
  | "PAY_CHILD_MACCOUNT"
  | "DEBIT_CHILD_MACCOUNT";

type Common = {
  amount: string;
  currency: "AUD";
  callerUniqueReference: string;
};

type DcDeFields = {
  bsb?: string;
  bsbNumber?: string;
  accountNumber: string;
  accountName: string;
  lodgementReference?: string;
};

type TokenFields = {
  token: string;
  lodgementReference?: string;
};

type NppBankFields = {
  bsb?: string;
  bsbNumber?: string;
  accountNumber: string;
  accountName: string;
  lodgementReference?: string;
};

type NppPayIdFields = {
  payId: string;
  payIdType: "Email" | "Phone" | "ABN" | "OrganisationId";
  remitterName?: string;
  lodgementReference?: string;
};

type BpayFields = {
  billerCode: string;
  crn: string;              // customer reference number (CRN)
  billerName?: string;
};

type ChildFields = {
  mAccountNumber: string;
  lodgementReference?: string;
};

export type BuildInput = Common & {
  rail: Rail;
  // IMPORTANT: for Direct Debit (Token) we must be able to pass a token source
  source:
    | { type: "mAccount" }
    | { type: "token"; token: string }
    | { type: "mWallet"; mWalletId: string; pin?: string }; // BPAY use-case
  fields:
    | DcDeFields
    | TokenFields
    | NppBankFields
    | NppPayIdFields
    | BpayFields
    | ChildFields;
};

const coerceBsb = (x?: string) => (x || "").replace(/\s|-/g, "");

export function buildMonoovaPayment(input: BuildInput) {
  const { rail, amount, currency, callerUniqueReference, source } = input;

  const base: any = {
    callerUniqueReference,
    source,
    disbursements: [
      {
        type: "DE",
        amount,
        currency,
      },
    ],
  };

  const d0 = base.disbursements[0];

  switch (rail) {
    case "DIRECT_CREDIT_DE": {
      const f = input.fields as DcDeFields;
      d0.disbursementMethod = METHOD.DIRECT_CREDIT_DE;
      d0.toDirectCreditDetails = {
        bsbNumber: f.bsbNumber || coerceBsb(f.bsb),
        accountNumber: f.accountNumber,
        accountName: f.accountName,
        lodgementReference: f.lodgementReference,
      };
      break;
    }

    // Direct Credit to a BANK-ACCOUNT TOKEN ("token" method)
    case "DIRECT_CREDIT_TOKEN": {
      const f = input.fields as TokenFields;
      d0.disbursementMethod = METHOD.TOKEN;
      // Per docs, token is the destination; put it at the disbursement level as `toToken`
      // and keep lodgementReference at disbursement level (not inside details).
      d0.toToken = f.token;
      if (f.lodgementReference) d0.lodgementReference = f.lodgementReference;
      break;
    }

    // Direct Debit using a SOURCE BANK-ACCOUNT TOKEN
    case "DIRECT_DEBIT_TOKEN": {
      const f = input.fields as TokenFields;
      // For DD token, the token belongs to the *source*.
      // Ensure the caller provided source.type = "token"
      if (source?.type !== "token") {
        throw new Error(
          "Direct Debit (Token) requires source.type='token' and source.token=<guid>"
        );
      }
      d0.disbursementMethod = METHOD.DIRECT_DEBIT;
      if (f.lodgementReference) d0.lodgementReference = f.lodgementReference;
      break;
    }

    case "NPP_BANK": {
      const f = input.fields as NppBankFields;
      d0.disbursementMethod = METHOD.NPP_BANK;
      // Details key follows the method name: NppCreditBankAccount
      d0.toNppCreditBankAccountDetails = {
        bsbNumber: f.bsbNumber || coerceBsb(f.bsb),
        accountNumber: f.accountNumber,
        accountName: f.accountName,
        lodgementReference: f.lodgementReference,
      };
      break;
    }

    case "NPP_PAYID": {
      const f = input.fields as NppPayIdFields;
      d0.disbursementMethod = METHOD.NPP_PAYID;
      d0.toNppCreditPayIdDetails = {
        payId: f.payId,
        payIdType: f.payIdType,
        remitterName: f.remitterName,
        lodgementReference: f.lodgementReference,
      };
      break;
    }

    case "BPAY": {
      const f = input.fields as BpayFields;
      d0.disbursementMethod = METHOD.BPAY;
      d0.toBPayDetails = {
        billerCode: f.billerCode,
        referenceNumber: f.crn,
        billerName: f.billerName,
      };
      break;
    }

    case "PAY_CHILD_MACCOUNT": {
      const f = input.fields as ChildFields;
      d0.disbursementMethod = METHOD.PAY_CHILD_MACCOUNT;
      d0.toChildMaccountDetails = {
        mAccountNumber: f.mAccountNumber,
        lodgementReference: f.lodgementReference,
      };
      break;
    }

    case "DEBIT_CHILD_MACCOUNT": {
      const f = input.fields as ChildFields;
      d0.disbursementMethod = METHOD.DEBIT_CHILD_MACCOUNT;
      d0.fromChildMaccountDetails = {
        mAccountNumber: f.mAccountNumber,
        lodgementReference: f.lodgementReference,
      };
      break;
    }

    default:
      throw new Error(`Unsupported rail: ${rail}`);
  }

  return base;
}