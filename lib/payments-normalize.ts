type AnyRecord = Record<string, any>;

type DEInput = {
  type: "DE";
  amount: string;
  currency: string;
  details?: {
    bsb?: string;
    accountNumber?: string;
    remitterName?: string;       // -> accountName
    accountName?: string;
    reference?: string;          // -> lodgementReference
    lodgementReference?: string;
  };
  toDirectCreditDetails?: {
    bsb?: string;
    bsbNumber?: string;
    toBSB?: string;
    BSB?: string;
    accountNumber?: string;
    accountName?: string;
    lodgementReference?: string;
  };
  disbursementMethod?: string;
} & AnyRecord;

function cleanBsb(v?: string): string | undefined {
  if (!v) return undefined;
  const digits = String(v).replace(/\D/g, "");
  return digits.length ? digits.padStart(6, "0").slice(-6) : undefined;
}

function omitUndefined<T extends AnyRecord>(obj: T): T {
  const out: AnyRecord = {};
  for (const k of Object.keys(obj)) {
    const v = (obj as AnyRecord)[k];
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

export function normaliseValidateBody(body: any) {
  const data = typeof body === "string" ? JSON.parse(body) : (body ?? {});
  const disb = Array.isArray(data.disbursements) ? data.disbursements : [];

  const fixed = disb.map((d: DEInput | AnyRecord) => {
    if ((d?.type || "").toUpperCase() !== "DE") return d;

    const legacy = d?.details ?? {};
    const given = d?.toDirectCreditDetails ?? {};

    const bsbRaw =
      given.bsb ??
      given.bsbNumber ??
      given.toBSB ??
      given.BSB ??
      legacy.bsb;

    const bsb = cleanBsb(bsbRaw);
    const accountNumber = given.accountNumber ?? legacy.accountNumber;
    const accountName = given.accountName ?? legacy.accountName ?? legacy.remitterName;
    const lodgementReference =
      given.lodgementReference ?? legacy.lodgementReference ?? legacy.reference;

    // Provide ALL common keys so any tenant-side schema will recognise one:
    const toDirectCreditDetails = omitUndefined({
      bsb,
      bsbNumber: bsb,
      toBSB: bsb,
      BSB: bsb,
      accountNumber,
      accountName,
      lodgementReference,
    });

    const { details: _dropLegacy, toDirectCreditDetails: _dropGiven, ...rest } = d;

    return {
      ...rest,
      type: "DE",
      disbursementMethod: "DirectCredit",
      toDirectCreditDetails,
    };
  });

  return {
    ...data,
    disbursements: fixed,
  };
}