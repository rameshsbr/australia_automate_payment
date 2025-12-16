"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Env } from "../chrome";

export function EnvToggle({ env }: { env: Env }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const qs = useMemo(() => {
    const str = search?.toString();
    return str && str.length ? `?${str}` : "";
  }, [search]);

  const isSandbox = env === "sandbox";
  const currentPath = pathname || "/";

  function onToggle() {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const withoutSandbox = currentPath.startsWith("/sandbox")
      ? currentPath.slice("/sandbox".length) || "/"
      : currentPath;
    const nextPath = isSandbox ? withoutSandbox : `/sandbox${withoutSandbox}`;
    router.replace(`${nextPath}${qs}${hash}`, { scroll: false });
  }

  return (
    <button
      aria-label="Toggle sandbox mode"
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
