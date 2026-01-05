"use client";

import type { Env } from "../chrome";

export function EnvToggle({ env }: { env: Env }) {
  const isSandbox = env === "sandbox";

  async function onToggle() {
    const next = isSandbox ? "live" : "sandbox";
    try {
      await fetch("/api/debug/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env: next }),
      });
    } finally {
      // Reload so server components and API calls pick up the cookie.
      window.location.reload();
    }
  }

  return (
    <button
      aria-label="Toggle sandbox/live"
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          isSandbox ? "translate-x-1" : "translate-x-6"
        }`}
      />
    </button>
  );
}