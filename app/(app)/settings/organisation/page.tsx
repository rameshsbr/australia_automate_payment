"use client";

import Link from "next/link";

export default function OrganisationDetailsPage() {
  return (
    <>
      <div className="text-subt text-sm mb-3">
        <Link href=".." className="hover:underline">
          ← Settings
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Organisation details</h1>

      <div className="bg-panel rounded-xl2 border border-outline/40 overflow-hidden">
        <div className="px-5 py-3 text-sm text-subt border-b border-outline/30">Profile</div>
        <div className="px-5 py-4">
          <div className="bg-surface border border-outline/40 rounded-lg px-4 h-11 flex items-center">
            {/* keep empty until wired */}
            <span className="text-subt">Organisation name</span>
            <span className="ml-auto text-white"></span>
          </div>
        </div>
      </div>
    </>
  );
}
