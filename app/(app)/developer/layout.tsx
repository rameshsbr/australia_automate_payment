"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { modeFromPathname } from "@/lib/mode";

const TABS = [
  { href: "/developer", label: "Overview", exact: true },
  { href: "/developer/api-history", label: "API history" },
  { href: "/developer/audit-logs", label: "Audit logs" },
  { href: "/developer/api-keys", label: "API keys" },
  { href: "/developer/subscriptions", label: "Subscriptions" },
  { href: "/developer/webhooks", label: "Webhooks" },
];

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalizedPath = (pathname || "/").replace(/^\/sandbox(?=\/|$)/, "");
  const modePrefix = modeFromPathname(pathname || "/") === "sandbox" ? "/sandbox" : "";

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">Developer</h1>
        <Link
          href={`${modePrefix}/docs/api`}
          className="text-sm underline decoration-dotted opacity-80 hover:opacity-100"
        >
          View API documentation
        </Link>
      </div>

      <div className="flex gap-6 text-sm mb-4 border-b border-outline/40">
        {TABS.map((tab) => {
          const active = tab.exact
            ? normalizedPath === tab.href
            : normalizedPath.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              className={`pb-3 -mb-px ${
                active ? "font-medium text-white border-b-2" : "text-subt hover:text-white"
              }`}
              href={`${modePrefix}${tab.href}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </>
  );
}
