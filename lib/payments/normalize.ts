export type RailKey =
  | "DE_DIRECT_CREDIT"
  | "DE_DIRECT_CREDIT_TOKEN"
  | "DE_DIRECT_DEBIT_TOKEN"
  | "NPP_BANK"
  | "NPP_PAYID"
  | "BPAY"
  | "PAY_CHILD"
  | "DEBIT_CHILD";

export type BaseForm = {
  callerUniqueReference: string;
  sourceType: "mAccount";
  amount: string;              // e.g. "1.00"
  currency: "AUD";
  rail: RailKey;

  // shared-ish fields
  lodgementReference?: string;
  accountName?: string;

  // DC/NPP bank
  bsbNumber?: string;
  accountNumber?: string;

  // PayID
  payId?: string;
  payIdType?: "Email" | "Mobile" | "ABN" | "OrganisationId" | "Username";

  // Tokens
  token?: string;

  // BPAY
  billerCode?: string;
  crn?: string;
  billerName?: string;

  // Child mAccount
  mAccountNumber?: string;
};

export function normalizeToMonoovaPayload(form: BaseForm) {
  const base = {
    callerUniqueReference: form.callerUniqueReference,
    source: { type: "mAccount" as const },
    disbursements: [
      {
        type: "DE" as const,
        amount: form.amount,
        currency: form.currency,
      } as Record<string, any>,
    ],
  };

  const d = base.disbursements[0];

  switch (form.rail) {
    case "DE_DIRECT_CREDIT": {
      d.disbursementMethod = "DirectCredit";
      d.toDirectCreditDetails = {
        bsbNumber: form.bsbNumber,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
        lodgementReference: form.lodgementReference,
      };
      break;
    }
    case "DE_DIRECT_CREDIT_TOKEN": {
      d.disbursementMethod = "DirectCredit";
      d.toDirectCreditUsingTokenDetails = {
        token: form.token,
        lodgementReference: form.lodgementReference,
      };
      break;
    }
    case "DE_DIRECT_DEBIT_TOKEN": {
      d.disbursementMethod = "DirectDebit";
      d.toDirectDebitUsingTokenDetails = {
        token: form.token,
        lodgementReference: form.lodgementReference,
      };
      break;
    }
    case "NPP_BANK": {
      d.disbursementMethod = "NppPay";
      d.toNppBankAccountDetails = {
        bsbNumber: form.bsbNumber,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
        lodgementReference: form.lodgementReference,
      };
      break;
    }
    case "NPP_PAYID": {
      d.disbursementMethod = "NppPay";
      d.toNppPayIdDetails = {
        payId: form.payId,
        payIdType: form.payIdType,
        remitterName: form.accountName,
        lodgementReference: form.lodgementReference,
      };
      break;
    }
    case "BPAY": {
      d.disbursementMethod = "BpayOut";
      d.toBpayDetails = {
        billerCode: form.billerCode,
        crn: form.crn,
        billerName: form.billerName,
      };
      break;
    }
    case "PAY_CHILD": {
      d.disbursementMethod = "PayChildMaccount";
      d.toChildMaccountDetails = {
        mAccountNumber: form.mAccountNumber,
        lodgementReference: form.lodgementReference,
      };
      break;
    }
    case "DEBIT_CHILD": {
      d.disbursementMethod = "DebitChildMaccount";
      d.fromChildMaccountDetails = {
        mAccountNumber: form.mAccountNumber,
        lodgementReference: form.lodgementReference,
      };
      break;
    }
    default:
      throw new Error(`Unknown rail: ${form.rail}`);
  }

  return base;
}
