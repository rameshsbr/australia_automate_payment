"use client";

import Link from "next/link";
import { AppShell } from "@/components/chrome";

function Tile({
  href,
  title,
  subtitle,
  icon,
}: { href: string; title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block bg-panel border border-outline/40 rounded-xl2 p-5 hover:bg-panel/70 transition"
    >
      <div className="flex items-center gap-3">
        <div className="text-xl">{icon ?? "•"}</div>
        <div>
          <div className="font-medium text-white">{title}</div>
          {subtitle ? <div className="text-sm text-subt mt-1">{subtitle}</div> : null}
        </div>
      </div>
    </Link>
  );
}

export default function SettingsIndex() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Tile href="users" title="Users" icon="👤" />
        <Tile href="payment-authorisation" title="Payment authorisation" icon="↔︎" />
        <Tile href="organisation" title="Organisation details" icon="🏬" />
        <Tile href="accounts" title="Accounts" icon="🏦" />
      </div>
    </AppShell>
  );
}
