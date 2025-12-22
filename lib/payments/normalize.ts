export type Rail =
  | "DIRECT_CREDIT_DE"
  | "DIRECT_CREDIT_TOKEN"
  | "NPP_BANK"
  | "NPP_PAYID"
  | "BPAY";
// | "DIRECT_DEBIT_TOKEN"          // disabled (unknown method in tenant)
// | "PAY_CHILD_MACCOUNT"          // disabled (unknown method in tenant)
// | "DEBIT_CHILD_MACCOUNT";       // disabled (unknown method in tenant)

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
  accountName: string; // REQUIRED by API
  remitterName?: string;
  lodgementReference?: string;
};

type BpayFields = {
  billerCode: string;
  crnOrReferenceNumber: string;
  billerName?: string;
};

export type BuildInput = Common & {
  rail: Rail;
  source: { type: "mAccount" } | { type: "mWallet"; mWalletId: string; pin: string };
  fields: DcDeFields | TokenFields | NppBankFields | NppPayIdFields | BpayFields;
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
      d0.disbursementMethod = "directcredit";
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
      d0.disbursementMethod = "token";
      d0.toToken = f.token;
      if (f.lodgementReference) d0.lodgementReference = f.lodgementReference;
      break;
    }

    case "NPP_BANK": {
      const f = input.fields as NppBankFields;
      d0.disbursementMethod = "nppcreditbankaccount";
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
      d0.disbursementMethod = "nppcreditpayid";
      d0.toNppCreditPayIdDetails = {
        payId: f.payId,
        payIdType: f.payIdType,
        accountName: f.accountName,
        remitterName: f.remitterName,
        lodgementReference: f.lodgementReference,
      };
      break;
    }

    case "BPAY": {
      const f = input.fields as BpayFields;
      if (input.source.type !== "mWallet") {
        throw new Error("BPAY requires source.type=mWallet with mWalletId and pin");
      }
      d0.disbursementMethod = "bpay";
      d0.toBPayDetails = {
        billerCode: f.billerCode,
        referenceNumber: f.crnOrReferenceNumber,
        billerName: f.billerName,
      };
      break;
    }

    default:
      throw new Error(`Unsupported rail for this tenant: ${rail}`);
  }

  return base;
}
