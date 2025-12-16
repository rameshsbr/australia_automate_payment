"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/chrome";
import { Popover } from "@/components/ui";

type ColumnState = {
  name: boolean;
  roles: boolean;
  lastLogin: boolean;
};

export default function UsersListPage() {
  // no data yet – empty array; wire to backend later
  const users: Array<{
    id: string;
    name: string;
    email: string;
    roles: string[];
    lastLogin: string;
  }> = [];

  const [query, setQuery] = useState("");
  const [cols, setCols] = useState<ColumnState>({
    name: true,
    roles: true,
    lastLogin: true,
  });

  const filtered = useMemo(() => {
    // keep logic but empty list will produce 0 rows
    const q = query.trim().toLowerCase();
    return q
      ? users.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.roles.join(", ").toLowerCase().includes(q)
        )
      : users;
  }, [users, query]);

  return (
    <AppShell>
      <div className="text-subt text-sm mb-3">
        <Link href="/settings" className="hover:underline">
          ← Settings
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Link
          href="/settings/users/invite"
          className="bg-[#6d44c9] rounded-lg h-9 px-3 inline-flex items-center text-sm"
        >
          + Invite user
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 bg-panel border border-outline/40 rounded-lg h-9 px-3 text-sm placeholder:text-subt/70"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search users"
        />

        <Popover
          align="right"
          button={() => (
            <button className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">
              ⚙️ Edit columns
            </button>
          )}
          className="w-[220px]"
        >
          <div className="text-sm space-y-2">
            {([
              ["name", "Name"],
              ["roles", "Roles"],
              ["lastLogin", "Last Login"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cols[key]}
                  onChange={() => setCols((c) => ({ ...c, [key]: !c[key] } as ColumnState))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </Popover>

        <button className="inline-flex items-center gap-2 bg-panel border border-outline/40 rounded-lg px-3 h-9 text-sm">
          ⬇️ Export
        </button>
      </div>

      <div className="bg-panel rounded-xl2 border border-outline/40">
        <div className="grid grid-cols-[2fr,2fr,1fr,32px] text-xs text-subt px-4 py-2">
          {cols.name && <div>NAME</div>}
          {cols.roles && <div>ROLES</div>}
          {cols.lastLogin && <div>LAST LOGIN</div>}
          <div />
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-subt">
            <div className="mb-2 text-xl">👥</div>
            <div className="font-medium text-white">No users yet</div>
            <div className="text-sm mt-1">Invite a user to get started.</div>
          </div>
        ) : (
          filtered.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[2fr,2fr,1fr,32px] items-center text-sm px-4 py-3 border-t border-outline/20"
            >
              {cols.name && (
                <div>
                  <div className="text-white">{user.name}</div>
                  <div className="text-xs text-subt">{user.email}</div>
                </div>
              )}
              {cols.roles && <div className="text-subt text-sm">{user.roles.join(", ")}</div>}
              {cols.lastLogin && <div className="text-subt text-sm">{user.lastLogin}</div>}
              <div className="text-right text-subt">…</div>
            </div>
          ))
        )}
      </div>

      <div className="mt-2 text-xs text-subt">
        {filtered.length === 0
          ? "Showing 0 – 0 of 0"
          : `Showing 1 – ${filtered.length} of ${filtered.length}`}
      </div>
    </AppShell>
  );
}
