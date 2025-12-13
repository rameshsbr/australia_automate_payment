"use client";
import Link from "next/link";
import { useEnv } from "./env-provider";
import { usePathname } from "next/navigation";

const NavItem = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
  const path = usePathname();
  const active = path.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition
        ${active ? "bg-panel text-white" : "text-subt hover:bg-panel/60"}`}
    >
      <span className="text-sm">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { env, setEnv } = useEnv();
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-outline/40 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded bg-accent" />
          <div className="text-sm font-medium">UB AdsMedia Pty Ltd</div>
        </div>
        <NavItem href="/summary" label="Summary" icon="🏠" />
        <NavItem href="/settings" label="Settings" icon="⚙️" />
        <div className="mt-1 border-t border-outline/30 pt-2" />
        <NavItem href="/dashboard" label="Dashboard" icon="📊" />
        <NavItem href="/transactions" label="Transactions" icon="🧾" />
        <NavItem href="/payments" label="Payments" icon="💸" />
        <NavItem href="/automatchers" label="Automatchers" icon="🤖" />
        <NavItem href="/statements" label="Statements" icon="📄" />
        <NavItem href="/reports" label="Reports" icon="📈" />
        <NavItem href="/developer" label="Developer" icon="🧩" />
        <div className="mt-auto">
          <NavItem href="/foreign-exchange" label="Foreign exchange" icon="🌐" />
          <NavItem href="/support" label="Support" icon="🛟" />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Topbar */}
        <div className="sticky top-0 z-10 bg-surface/75 backdrop-blur border-b border-outline/40">
          <div className="flex items-center justify-between px-6 h-14">
            <div className="text-sm text-subt">SANDBOX MODE</div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-subt">Sandbox mode</div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={env === "SANDBOX"}
                  onChange={(e) => setEnv(e.target.checked ? "SANDBOX" : "LIVE")}
                />
                <div className="w-11 h-6 bg-outline/50 peer-focus:outline-none rounded-full peer peer-checked:bg-accent transition" />
                <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition
                                ${env === "SANDBOX" ? "translate-x-0" : "translate-x-5"}`} />
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
