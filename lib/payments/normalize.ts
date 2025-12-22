// lib/payments/normalize.ts
//
// Build a Monoova /financial/v2/transaction/{validate|execute} body
// from our SinglePaymentForm values. Leaves UI untouched.

export type Rail =
  | "DIRECT_CREDIT_DE"
  | "DIRECT_CREDIT_TOKEN"
  | "DIRECT_DEBIT_TOKEN"
  | "NPP_BANK"
  | "NPP_PAYID"
  | "BPAY"
  | "PAY_CHILD_MACCOUNT"
  | "DEBIT_CHILD_MACCOUNT";

type Common = {
  amount: string;             // "1.00"
  currency: "AUD";
  callerUniqueReference: string;
};

type DcDeFields = {
  bsb?: string;
  bsbNumber?: string;
  accountNumber: string;
  accountName: string;        // “remitterName” label in UI for DE
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
  payId: string;              // email/phone/abn etc
  payIdType: "Email" | "Phone" | "ABN" | "OrganisationId";
  remitterName?: string;
  lodgementReference?: string;
};

type BpayFields = {
  billerCode: string;
  crn: string;                // customer reference / CRN
  billerName?: string;        // optional
};

type ChildFields = {
  mAccountNumber: string;
  lodgementReference?: string;
};

export type BuildInput = Common & {
  rail: Rail;
  source: { type: "mAccount" }; // current scope
  fields:
    | DcDeFields
    | TokenFields
    | NppBankFields
    | NppPayIdFields
    | BpayFields
    | ChildFields;
};

// Normalise BSB handling (some UX fields provide `bsb`, API accepts `bsbNumber`)
const coerceBsb = (x?: string) => (x || "").replace(/\s|-/g, "");

export function buildMonoovaPayment(input: BuildInput) {
  const { rail, amount, currency, callerUniqueReference, source } = input;

  const base: any = {
    callerUniqueReference,
    source, // { type: "mAccount" }
    disbursements: [
      {
        type: "DE",
        amount,
        currency,
        // disbursementMethod + one details object below
      },
    ],
  };

  const d0 = base.disbursements[0];

  switch (rail) {
    case "DIRECT_CREDIT_DE": {
      const f = input.fields as DcDeFields;
      d0.disbursementMethod = "DirectCredit";
      d0.toDirectCreditDetails = {
        bsbNumber: f.bsbNumber || coerceBsb(f.bsb),
        accountNumber: f.accountNumber,
        accountName: f.accountName,
        lodgementReference: f.lodgementReference,
      };
      break;
    }

    case "DIRECT_CREDIT_TOKEN": {
      const f = input.fields as TokenFields;
      // Monoova expects token variant with a distinct details object
      d0.disbursementMethod = "DirectCreditToken";
      d0.toDirectCreditUsingTokenDetails = {
        token: f.token,
        lodgementReference: f.lodgementReference,
      };
      break;
    }

    case "DIRECT_DEBIT_TOKEN": {
      const f = input.fields as TokenFields;
      d0.disbursementMethod = "DirectDebitToken";
      d0.toDirectDebitUsingTokenDetails = {
        token: f.token,
        lodgementReference: f.lodgementReference,
      };
      break;
    }

    case "NPP_BANK": {
      const f = input.fields as NppBankFields;
      // NPP to bank account (not PayID)
      d0.disbursementMethod = "NppPayBankAccount";
      d0.toNppBankAccountDetails = {
        bsbNumber: f.bsbNumber || coerceBsb(f.bsb),
        accountNumber: f.accountNumber,
        accountName: f.accountName,
        lodgementReference: f.lodgementReference,
      };
      break;
    }

    case "NPP_PAYID": {
      const f = input.fields as NppPayIdFields;
      d0.disbursementMethod = "NppPayPayId";
      d0.toNppPayIdDetails = {
        payId: f.payId,
        payIdType: f.payIdType,
        remitterName: f.remitterName,
        lodgementReference: f.lodgementReference,
      };
      break;
    }

    case "BPAY": {
      const f = input.fields as BpayFields;
      // Docs show lowercase 'bpay' in some examples; TitleCase also accepted in practice.
      d0.disbursementMethod = "Bpay";
      // API sample shows `toBPayDetails` (capital P); keep that exact casing.
      d0.toBPayDetails = {
        billerCode: f.billerCode,
        referenceNumber: f.crn, // CRN maps to referenceNumber
        billerName: f.billerName,
      };
      break;
    }

    case "PAY_CHILD_MACCOUNT": {
      const f = input.fields as ChildFields;
      d0.disbursementMethod = "PayChildMAccount";
      d0.toChildMaccountDetails = {
        mAccountNumber: f.mAccountNumber,
        lodgementReference: f.lodgementReference,
      };
      break;
    }

    case "DEBIT_CHILD_MACCOUNT": {
      const f = input.fields as ChildFields;
      d0.disbursementMethod = "DebitChildMAccount";
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
