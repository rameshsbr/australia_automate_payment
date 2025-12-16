"use client";

import Link from "next/link";

export default function InviteUserPage() {
  return (
    <>
      <div className="text-subt text-sm mb-3">
        <Link href=".." className="hover:underline">
          ← Users
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Invite user</h1>

      <div className="max-w-xl bg-panel rounded-xl2 border border-outline/40 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">
            <div className="mb-1 text-subt">First name</div>
            <input className="w-full h-9 bg-surface border border-outline/40 rounded-lg px-3 text-sm" />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-subt">Last name</div>
            <input className="w-full h-9 bg-surface border border-outline/40 rounded-lg px-3 text-sm" />
          </label>

          <label className="text-sm md:col-span-2">
            <div className="mb-1 text-subt">Email</div>
            <input className="w-full h-9 bg-surface border border-outline/40 rounded-lg px-3 text-sm" />
          </label>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Link
            href=".."
            className="inline-flex items-center justify-center bg-panel border border-outline/40 rounded-lg h-9 px-4 text-sm"
          >
            Cancel
          </Link>
          <button className="inline-flex items-center justify-center bg-[#6d44c9] rounded-lg h-9 px-4 text-sm">
            Invite
          </button>
        </div>
      </div>
    </>
  );
}
