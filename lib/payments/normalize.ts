export type Rail =
  | "Direct Credit (DE)"
  | "Direct Credit (Token)"
  | "Direct Debit (Token)"
  | "NPP – Bank Account"
  | "NPP – PayID"
  | "BPAY"
  | "Pay Child mAccount"
  | "Debit Child mAccount";

export type BaseForm = {
  amount: string;
  currency: string;
  reference?: string;
};

export type DirectEntryFields = {
  bsb?: string;
  bsbNumber?: string;
  accountNumber?: string;
  accountName?: string;
};

export type PayIdFields = {
  payId?: string;
  payIdType?: "Email" | "Phone" | "ABN" | "OrgId";
  remitterName?: string;
};

export type BpayFields = {
  billerCode?: string;
  crn?: string;
  billerName?: string;
};

export type TokenFields = {
  token?: string;
};

export type ChildFields = {
  mAccountNumber?: string;
};

export type RailSpecific =
  | DirectEntryFields
  | PayIdFields
  | BpayFields
  | TokenFields
  | ChildFields;

export type NormalizeInput = BaseForm & {
  rail: Rail;
  callerUniqueReference: string;
  source: { type: "mAccount" };
  fields: RailSpecific;
};

function pickBSB(v?: string) {
  return v?.replace(/\D/g, "");
}

export function buildMonoovaDisbursement(input: NormalizeInput) {
  const { rail, amount, currency, reference, fields } = input;
  const disb: any = { type: "DE", amount, currency };

  switch (rail) {
    case "Direct Credit (DE)": {
      const f = fields as DirectEntryFields;
      disb.disbursementMethod = "DirectCredit";
      disb.toDirectCreditDetails = {
        bsbNumber: f.bsbNumber || pickBSB(f.bsb),
        accountNumber: f.accountNumber,
        accountName: f.accountName,
        lodgementReference: reference,
      };
      return disb;
    }

    case "Direct Credit (Token)": {
      const f = fields as TokenFields;
      disb.toDirectCreditUsingTokenDetails = {
        token: f.token,
        lodgementReference: reference,
      };
      return disb;
    }

    case "Direct Debit (Token)": {
      const f = fields as TokenFields;
      disb.toDirectDebitUsingTokenDetails = {
        token: f.token,
        lodgementReference: reference,
      };
      return disb;
    }

    case "NPP – Bank Account": {
      const f = fields as DirectEntryFields;
      disb.toNppBankAccountDetails = {
        bsbNumber: f.bsbNumber || pickBSB(f.bsb),
        accountNumber: f.accountNumber,
        accountName: f.accountName,
        lodgementReference: reference,
      };
      return disb;
    }

    case "NPP – PayID": {
      const f = fields as PayIdFields;
      disb.toNppPayIdDetails = {
        payId: f.payId,
        payIdType: f.payIdType || "Email",
        remitterName: f.remitterName,
        lodgementReference: reference,
      };
      return disb;
    }

    case "BPAY": {
      const f = fields as BpayFields;
      disb.toBpayDetails = {
        billerCode: f.billerCode,
        crn: f.crn,
        billerName: f.billerName,
      };
      return disb;
    }

    case "Pay Child mAccount": {
      const f = fields as ChildFields;
      disb.toChildMaccountDetails = {
        mAccountNumber: f.mAccountNumber,
        lodgementReference: reference,
      };
      return disb;
    }

    case "Debit Child mAccount": {
      const f = fields as ChildFields;
      disb.fromChildMaccountDetails = {
        mAccountNumber: f.mAccountNumber,
        lodgementReference: reference,
      };
      return disb;
    }
  }
}

export function buildMonoovaPayment(input: NormalizeInput) {
  return {
    callerUniqueReference: input.callerUniqueReference,
    source: input.source,
    disbursements: [buildMonoovaDisbursement(input)],
  };
}

// Legacy helpers still imported elsewhere; keep a no-op passthrough so API routes compile.
export function toMonoovaRequest(body: any) {
  return body;
}

export const PAYMENT_RAILS: { id: Rail; label: Rail }[] = [
  { id: "Direct Credit (DE)", label: "Direct Credit (DE)" },
  { id: "Direct Credit (Token)", label: "Direct Credit (Token)" },
  { id: "Direct Debit (Token)", label: "Direct Debit (Token)" },
  { id: "NPP – Bank Account", label: "NPP – Bank Account" },
  { id: "NPP – PayID", label: "NPP – PayID" },
  { id: "BPAY", label: "BPAY" },
  { id: "Pay Child mAccount", label: "Pay Child mAccount" },
  { id: "Debit Child mAccount", label: "Debit Child mAccount" },
];

export const RAIL_FIELD_GROUPS: Record<
  Rail,
  Array<"deBank" | "token" | "payId" | "bpay" | "child">
> = {
  "Direct Credit (DE)": ["deBank"],
  "Direct Credit (Token)": ["token"],
  "Direct Debit (Token)": ["token"],
  "NPP – Bank Account": ["deBank"],
  "NPP – PayID": ["payId"],
  BPAY: ["bpay"],
  "Pay Child mAccount": ["child"],
  "Debit Child mAccount": ["child"],
};
