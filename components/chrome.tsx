"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEnv } from "./env-provider";
import { useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";

function NavItem({
  href,
  label,
  icon,
  active
}: { href: string; label: string; icon?: ReactNode; active?: boolean }) {
  const path = usePathname();
  const isActive = active ?? path.startsWith(href);
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition",
        isActive ? "bg-[#342b63] text-white" : "text-subt hover:bg-panel/60"
      )}
    >
      <span className="text-base">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-subt px-3 py-2 text-sm">
      {children}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { env, setEnv } = useEnv();
  const [paymentsOpen, setPaymentsOpen] = useState(true);

  const searchHint = useMemo(() => {
    const isMac =
      typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");
    return isMac ? "⌘" : "Ctrl";
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-72 bg-surface border-r border-outline/40 p-3 flex flex-col gap-2">
        {/* Brand */}
        <div className="px-3 py-3">
          <div className="w-7 h-7 rounded bg-accent" />
        </div>

        {/* Org */}
        <GroupLabel>
          <span className="text-base">🏢</span>
          <span>UB AdsMedia Pty Ltd</span>
        </GroupLabel>

        <NavItem href="/summary" label="Summary" icon="🏠" />
        <NavItem href="/settings" label="Settings" icon="⚙️" />

        {/* Account block */}
        <div className="mt-2 border-t border-outline/30 pt-3" />
        <GroupLabel>
          <span className="text-base">🏦</span>
          <div className="flex flex-col">
            <span className="leading-4">UB AdsMedia Pty Ltd Account</span>
            <span className="text-xs text-subt leading-4">#6279059743697945</span>
          </div>
          <button
            className="ml-auto text-subt hover:text-white"
            aria-label="toggle account"
            onClick={() => setPaymentsOpen((v) => !v)}
          >
            {paymentsOpen ? "▾" : "▸"}
          </button>
        </GroupLabel>

        <NavItem href="/dashboard" label="Dashboard" icon="🧭" />
        <NavItem href="/transactions" label="Transactions" icon="🧾" />

        {/* Payments group */}
        <button
          onClick={() => setPaymentsOpen((v) => !v)}
          className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition text-subt hover:bg-panel/60"
          )}
        >
          <span className="text-base">↔️</span>
          <span className="text-sm">Payments</span>
          <span className="ml-auto">{paymentsOpen ? "▾" : "▸"}</span>
        </button>
        {paymentsOpen && (
          <div className="ml-8 flex flex-col gap-1">
            <NavItem href="/payments/review" label="Review payments" icon="🗂️" />
            <NavItem href="/payments/returned" label="Returned payments" icon="↩️" />
            <NavItem href="/payments/batch" label="Batch payments" icon="🧺" />
            <NavItem href="/payments/card" label="Card payments" icon="💳" />
            <NavItem href="/payments/rtgs-imt" label="RTGS/IMT payments" icon="🌏" />
            <NavItem href="/payments/payees" label="Payees" icon="👤" />
          </div>
        )}

        <NavItem href="/automatchers" label="Automatchers" icon="🧠" />
        <NavItem href="/statements" label="Statements" icon="📄" />
        <NavItem href="/reports" label="Reports" icon="📈" />
        <NavItem href="/developer" label="Developer" icon="🧩" />

        <div className="mt-auto" />

        <NavItem href="/foreign-exchange" label="Foreign exchange" icon="🌐" />
        <NavItem href="/support" label="Support" icon="🛟" />
        <div className="h-2" />
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Purple strip */}
        <div className="h-8 bg-[#6d44c9] flex items-center justify-center text-xs font-medium tracking-wide">
          SANDBOX MODE
        </div>

        {/* Topbar */}
        <div className="sticky top-8 z-10 bg-surface/80 backdrop-blur border-b border-outline/40">
          <div className="flex items-center justify-between px-6 h-14">
            {/* Search */}
            <div className="flex items-center gap-2 w-[520px]">
              <div className="relative flex-1">
                <input
                  className="w-full bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70 focus:outline-none"
                  placeholder={`Search…  (${searchHint} + K)`}
                />
                <div className="absolute right-2 top-1.5 text-xs text-subt/80 border border-outline/50 rounded px-1">
                  {searchHint} K
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="text-sm text-subt">Sandbox mode</div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={env === "SANDBOX"}
                  onChange={(e) => setEnv(e.target.checked ? "SANDBOX" : "LIVE")}
                />
                <div className="w-11 h-6 bg-outline/50 rounded-full peer peer-checked:bg-accent transition" />
                <div
                  className={clsx(
                    "absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition",
                    env === "SANDBOX" ? "translate-x-0" : "translate-x-5"
                  )}
                />
              </label>
              <div className="w-8 h-8 rounded-full bg-panel flex items-center justify-center text-xs">RS</div>
            </div>
          </div>
        </div>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
