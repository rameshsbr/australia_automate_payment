// components/chrome.tsx
"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import ModeProvider, { useAppMode } from "@/components/mode/ModeProvider";
import ModeToggle from "@/components/mode/ModeToggle";

function NavItem({
  href,
  label,
  icon,
  currentPath,
  modePrefix,
  active,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  currentPath: string;
  modePrefix: string;
  active?: boolean;
}) {
  const isActive = active ?? currentPath.startsWith(href);
  return (
    <Link
      href={`${modePrefix}${href}`}
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

/** Small dot that polls /api/dev/health */
function HealthPill() {
  const [state, setState] = useState<{
    ok: boolean;
    degraded: boolean;
    tip: string;
  }>({ ok: true, degraded: false, tip: "loading…" });

  useEffect(() => {
    let mounted = true;
    let t: any;

    const fetchIt = async () => {
      try {
        const r = await fetch("/api/dev/health", { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (!mounted) return;

        const parts: string[] = [];
        const okBits: boolean[] = [];
        if (j?.db) {
          parts.push(`DB:${j.db.ok ? "ok" : "fail"}(${j.db.ms}ms)`);
          okBits.push(Boolean(j.db.ok));
        }
        if (j?.monoova) {
          parts.push(`Monoova:${j.monoova.ok ? "ok" : "fail"}(${j.monoova.status ?? "?"})`);
          okBits.push(Boolean(j.monoova.ok));
        }
        if (j?.callback) {
          parts.push(`Callback:${j.callback.ok ? "ok" : "fail"}(${j.callback.status ?? "?"})`);
          okBits.push(Boolean(j.callback.ok));
        }
        const okCount = okBits.filter(Boolean).length;
        const ok = okCount === okBits.length && okBits.length > 0;
        const degraded = !ok && okCount > 0;

        setState({ ok, degraded, tip: parts.join(" • ") || "no data" });
      } catch {
        if (!mounted) return;
        setState({ ok: false, degraded: false, tip: "health check error" });
      } finally {
        t = setTimeout(fetchIt, 20000);
      }
    };

    fetchIt();
    return () => {
      mounted = false;
      if (t) clearTimeout(t);
    };
  }, []);

  const color = state.ok ? "bg-green-500" : state.degraded ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="flex items-center gap-2" title={state.tip}>
      <span className={clsx("inline-block w-2.5 h-2.5 rounded-full", color)} />
    </div>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const [paymentsOpen, setPaymentsOpen] = useState(true);
  const mode = useAppMode();
  const path = usePathname() || "/";
  const normalizedPath = path.replace(/^\/sandbox(?=\/|$)/, "");
  const modePrefix = mode === "sandbox" ? "/sandbox" : "";

  const searchHint = useMemo(() => {
    const isMac =
      typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");
    return isMac ? "⌘" : "Ctrl";
  }, []);

  const topOffset = mode === "sandbox" ? "top-8" : "top-0";

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

        <NavItem href="/summary" label="Summary" icon="🏠" currentPath={normalizedPath} modePrefix={modePrefix} />
        <NavItem href="/settings" label="Settings" icon="⚙️" currentPath={normalizedPath} modePrefix={modePrefix} />

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

        <NavItem href="/dashboard" label="Dashboard" icon="🧭" currentPath={normalizedPath} modePrefix={modePrefix} />
        <NavItem href="/transactions" label="Transactions" icon="🧾" currentPath={normalizedPath} modePrefix={modePrefix} />

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
            <NavItem href="/payments/review" label="Review payments" icon="🗂️" currentPath={normalizedPath} modePrefix={modePrefix} />
            <NavItem href="/payments/returned" label="Returned payments" icon="↩️" currentPath={normalizedPath} modePrefix={modePrefix} />
            <NavItem href="/payments/batch" label="Batch payments" icon="🧺" currentPath={normalizedPath} modePrefix={modePrefix} />
            <NavItem href="/payments/card" label="Card payments" icon="💳" currentPath={normalizedPath} modePrefix={modePrefix} />
            <NavItem href="/payments/rtgs-imt" label="RTGS/IMT payments" icon="🌏" currentPath={normalizedPath} modePrefix={modePrefix} />
            <NavItem href="/payments/payees" label="Payees" icon="👤" currentPath={normalizedPath} modePrefix={modePrefix} />
          </div>
        )}

        <NavItem href="/automatchers" label="Automatchers" icon="🧠" currentPath={normalizedPath} modePrefix={modePrefix} />
        <NavItem href="/payid" label="PayID" icon="🔖" currentPath={normalizedPath} modePrefix={modePrefix} />
        <NavItem href="/statements" label="Statements" icon="📄" currentPath={normalizedPath} modePrefix={modePrefix} />
        <NavItem href="/reports" label="Reports" icon="📈" currentPath={normalizedPath} modePrefix={modePrefix} />

        <NavItem href="/developer" label="Developer" icon="🧩" currentPath={normalizedPath} modePrefix={modePrefix} />

        <div className="mt-auto" />

        <NavItem href="/foreign-exchange" label="Foreign exchange" icon="🌐" currentPath={normalizedPath} modePrefix={modePrefix} />
        <NavItem href="/support" label="Support" icon="🛟" currentPath={normalizedPath} modePrefix={modePrefix} />
        <div className="h-2" />
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Purple strip (sticky) */}
        {mode === "sandbox" && (
          <div className="sticky top-0 z-30 h-8 bg-[#6d44c9] flex items-center justify-center text-xs font-medium tracking-wide">
            SANDBOX MODE
          </div>
        )}

        {/* Topbar (sticky under purple strip) */}
        <div className={clsx("sticky z-20 bg-surface/80 backdrop-blur border-b border-outline/40", topOffset)}>
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
              <HealthPill />
              <div className="text-sm text-subt">{mode === "sandbox" ? "Sandbox" : "Live"} mode</div>
              <ModeToggle />
              <div className="w-8 h-8 rounded-full bg-panel flex items-center justify-center text-xs">RS</div>
            </div>
          </div>
        </div>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ModeProvider>
      <ShellInner>{children}</ShellInner>
    </ModeProvider>
  );
}