import { describe, expect, it } from "vitest";
import { buildFinancialRequest } from "./build";

describe("buildFinancialRequest", () => {
  it("builds mAccount + directcredit", () => {
    const payload = buildFinancialRequest({
      totalAmount: 10,
      paymentSource: "mAccount",
      mAccountToken: "acct-token",
      uniqueReference: "ref-1",
      disbursements: [
        {
          method: "directcredit",
          amount: 10,
          toDirectCreditDetails: {
            bsbNumber: "062000",
            accountNumber: "12345678",
            accountName: "Demo",
          },
        },
      ],
    });
    expect(payload.mAccount.token).toBe("acct-token");
    expect(payload.disbursements[0].toDirectCreditDetails.accountNumber).toBe("12345678");
  });

  it("builds mWallet + bpay", () => {
    const payload = buildFinancialRequest({
      totalAmount: 5,
      paymentSource: "mWallet",
      mWalletToken: "wallet-token",
      mWalletPin: "1234",
      uniqueReference: "ref-2",
      disbursements: [
        {
          method: "bpay",
          amount: 5,
          toBPayDetails: { billerCode: "12345", referenceNumber: "98765" },
        },
      ],
    });
    expect(payload.mWallet.pin).toBe("1234");
    expect(payload.disbursements[0].toBPayDetails.billerCode).toBe("12345");
  });

  it("builds mAccount + nppcreditpayid", () => {
    const payload = buildFinancialRequest({
      totalAmount: 7,
      paymentSource: "mAccount",
      mAccountToken: "acct",
      uniqueReference: "ref-3",
      disbursements: [
        {
          method: "nppcreditpayid",
          amount: 7,
          toNppCreditPayIdDetails: {
            payId: "test@example.com",
            payIdType: "Email",
            accountName: "Tester",
          },
        },
      ],
    });
    expect(payload.disbursements[0].toNppCreditPayIdDetails.payIdType).toBe("Email");
  });

  it("builds mAccount child", () => {
    const payload = buildFinancialRequest({
      totalAmount: 3,
      paymentSource: "mAccount",
      mAccountToken: "acct",
      uniqueReference: "ref-4",
      disbursements: [{ method: "mAccount", amount: 3, toMAccount: "1234567890123456" }],
    });
    expect(payload.disbursements[0].toMAccount).toBe("1234567890123456");
  });

  it("builds token payout", () => {
    const payload = buildFinancialRequest({
      totalAmount: 2,
      paymentSource: "token",
      sourceToken: "source-guid",
      uniqueReference: "ref-5",
      disbursements: [{ method: "token", amount: 2, toToken: "dest-guid" }],
    });
    expect(payload.token).toBe("source-guid");
    expect(payload.disbursements[0].toToken).toBe("dest-guid");
  });
});
