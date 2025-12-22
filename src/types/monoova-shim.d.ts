declare namespace Monoova {
  // ---- Common fee shapes ----
  export interface FeeComponent {
    feeAmountExcludingGst: number;
    feeAmountGstComponent: number;
    feeAmountIncludingGst: number;
  }
  export interface DisbursementFee {
    disbursementArrayIndex: number;
    disbursementFee: FeeComponent;
  }
  export interface FeeBreakdown {
    debitFee?: FeeComponent;
    disbursementFees?: DisbursementFee[];
  }

  // ---- Disbursement method detail types ----
  export interface ToDirectCreditDetails {
    bsbNumber: string;
    accountNumber: string;
    accountName: string;
    lodgementReference?: string;
  }
  export interface ToNppCreditBankAccountDetails {
    bsbNumber: string;
    accountNumber: string;
    accountName: string;
    lodgementReference?: string;
  }
  export type PayIdType = "Email" | "Phone" | "ABN" | "OrganisationId";
  export interface ToNppCreditPayIdDetails {
    payId: string;
    payIdType: PayIdType;
    accountName: string;
    remitterName?: string;
    lodgementReference?: string;
    endToEndId?: string;
  }
  export interface ToBPayDetails {
    billerCode: string;
    referenceNumber: string;
    billerName?: string;
  }

  // ---- Disbursement union ----
  export type Disbursement =
    | ({
        disbursementMethod: "directcredit";
        amount: number;
        description?: string;
        toDirectCreditDetails: ToDirectCreditDetails;
      })
    | ({
        disbursementMethod: "nppcreditbankaccount";
        amount: number;
        description?: string;
        toNppCreditBankAccountDetails: ToNppCreditBankAccountDetails;
      })
    | ({
        disbursementMethod: "nppcreditpayid";
        amount: number;
        description?: string;
        toNppCreditPayIdDetails: ToNppCreditPayIdDetails;
      })
    | ({
        disbursementMethod: "bpay";
        amount: number;
        description?: string;
        toBPayDetails: ToBPayDetails;
      })
    | ({
        disbursementMethod: "mAccount";
        amount: number;
        description?: string;
        toMAccount: string;
      }) // 16-digit child mAccount
    | ({
        disbursementMethod: "token";
        amount: number;
        description?: string;
        toToken: string;
      });

  // ---- Source containers on root ----
  export type PaymentSource = "mAccount" | "mWallet" | "directDebit" | "token";

  export interface FinancialTransactionRequest {
    totalAmount: number;
    paymentSource: PaymentSource;

    // Only one of these per source type is expected by the API
    mAccount?: { token: string };
    mWallet?: { token: string; pin: string };
    token?: string;
    // directDebit?: { ... } // define when needed

    disbursements: Disbursement[];
    uniqueReference: string;
    description?: string;
  }

  // ---- Standard responses (Validate/Execute/Status) ----
  export interface ValidateResponse {
    durationMs: number;
    status: string;
    statusDescription: string;
    callerUniqueReference?: string;
    feeAmountExcludingGst: number;
    feeAmountGstComponent: number;
    feeAmountIncludingGst: number;
    feeBreakdown?: FeeBreakdown;
    transactionId?: number;
  }

  export interface ExecuteResponse extends ValidateResponse {
    bpayReceipts?: any[] | null;
  }

  export interface StatusByUidResponse {
    durationMs: number;
    status: string;
    statusDescription: string;
    transactions?: any[]; // be permissive; we render raw JSON
  }
  export interface StatusByDateResponse extends StatusByUidResponse {}
  export interface UnclearedReportResponse {
    durationMs: number;
    status: string;
    statusDescription: string;
    report?: any; // permissive
  }
}
