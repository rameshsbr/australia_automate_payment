export type ReportDef = {
  slug: string;
  title: string;
  description: string;
  dateKind: "single" | "range";
};

export const REPORTS: ReportDef[] = [
  {
    slug: "receivables",
    title: "Receivables report",
    description:
      "A daily report of all incoming transactions via an Automatcher",
    dateKind: "single",
  },
  {
    slug: "rtgs-imt-receivables",
    title: "RTGS/IMT receivables report",
    description:
      "A daily report of all payments received via real-time gross settlement and international money transfers (SWIFT)",
    dateKind: "range",
  },
  {
    slug: "payto-receivables",
    title: "PayTo receivables report",
    description:
      "A daily report of all payments received via PayTo",
    dateKind: "range",
  },
  {
    slug: "uncleared-funds",
    title: "Uncleared funds",
    description:
      "A snapshot of funds received via direct debit but no yet cleared or available",
    dateKind: "range",
  },
  {
    slug: "npp-ips-receivables",
    title: "NPP International Payment Service (IPS) receivables report",
    description:
      "A daily report detailing all domestic payments received via the NPP International Payment Service (IPS)",
    dateKind: "range",
  },
];

export function getReport(slug: string) {
  return REPORTS.find((r) => r.slug === slug);
}
