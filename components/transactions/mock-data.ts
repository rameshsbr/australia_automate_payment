"use client";

export type TransactionRow = {
  id: string;
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  balance?: number;
  reference?: string;
  transactionId?: string;
  type?: string;
  identifier?: string;
};

export const MOCK_TRANSACTIONS: TransactionRow[] = [
  {
    id: "tx-1",
    date: "2025-12-22T21:20:00+11:00",
    description:
      "Credit ABA BSB: 062-000 Account Number: 12345678 Account Name: Demo Remitter Name:",
    debit: 1,
    balance: 561837.13,
    reference: "0928c555-2487-4f0e-ae1d-3ebf1537404d",
    transactionId: "50645420",
    type: "Direct Debit",
    identifier: "ID-221"
  },
  {
    id: "tx-2",
    date: "2025-12-22T21:12:00+11:00",
    description:
      "Credit ABA BSB: 062-000 Account Number: 12345678 Account Name: Demo Remitter Name:",
    debit: 1,
    balance: 561838.13,
    reference: "894d2f50-10c9-49be-a5cd-ae3f1e1e20ec",
    transactionId: "50645418",
    type: "Direct Credit",
    identifier: "ID-222"
  },
  {
    id: "tx-3",
    date: "2025-12-22T18:59:00+11:00",
    description:
      "Credit ABA BSB: 062-000 Account Number: 12345678 Account Name: Demo Remitter Name:",
    debit: 1,
    balance: 561839.13,
    reference: "8b8f5f07-e1da-4137-9e16-9bd7bdf69deb",
    transactionId: "50645404",
    type: "NPP Direct Credit",
    identifier: "ID-223"
  },
  {
    id: "tx-4",
    date: "2025-12-22T18:58:00+11:00",
    description:
      "Credit ABA BSB: 062-000 Account Number: 12345678 Account Name: Demo Remitter Name:",
    debit: 1,
    balance: 561840.13,
    reference: "f80f0317-d4d5-41d3-b21a-b957e120bd49",
    transactionId: "50645402",
    type: "BPay Out",
    identifier: "ID-224"
  },
  {
    id: "tx-5",
    date: "2025-12-22T18:13:00+11:00",
    description:
      "Credit ABA BSB: 062-000 Account Number: 12345678 Account Name: Demo Remitter Name:",
    debit: 1,
    balance: 561841.13,
    reference: "2956ca36-2c9b-4f73-ac13-221fcaa907f8",
    transactionId: "50645385",
    type: "NPP Receivable",
    identifier: "ID-225"
  },
  {
    id: "tx-6",
    date: "2025-12-22T17:49:00+11:00",
    description:
      "Credit ABA BSB: 062-000 Account Number: 12345678 Account Name: Demo Remitter Name:",
    debit: 1,
    balance: 561842.13,
    reference: "71daaad5-a6aa-41ae-88c8-11803f4bf707",
    transactionId: "50645381",
    type: "DE Receivable",
    identifier: "ID-226"
  },
  {
    id: "tx-7",
    date: "2025-12-22T17:09:00+11:00",
    description:
      "Credit ABA BSB: 062-000 Account Number: 12345678 Account Name: Demo Remitter Name:",
    debit: 1,
    balance: 561843.13,
    reference: "686eab74-04ab-4e42-a0f5-17b37e3ec57f",
    transactionId: "50645375",
    type: "DE Direct Debit",
    identifier: "ID-227"
  },
  {
    id: "tx-8",
    date: "2025-12-22T16:52:00+11:00",
    description:
      "Credit ABA BSB: 062-000 Account Number: 12345678 Account Name: Demo Remitter Name:",
    debit: 1,
    balance: 561844.13,
    reference: "2594e2e0-116c-4ca2-8b79-885c4a26d882",
    transactionId: "50645372",
    type: "BPay Receivable",
    identifier: "ID-228"
  },
  {
    id: "tx-9",
    date: "2025-12-19T10:32:00+11:00",
    description:
      "NPP Credit for invoice #420: 42000-001. Remitter Name: Example Pty Ltd.",
    credit: 1850.75,
    balance: 563112.55,
    reference: "NPP-420-001",
    transactionId: "50640021",
    type: "NPP Direct Credit",
    identifier: "ID-211"
  },
  {
    id: "tx-10",
    date: "2025-12-16T14:05:00+11:00",
    description:
      "Direct Debit return for member 99882211. Remitter: Sample Org Pty Ltd.",
    debit: 250.0,
    balance: 560112.13,
    reference: "DD-RETURN-99882211",
    transactionId: "50639001",
    type: "Direct Debit",
    identifier: "ID-209"
  }
];
