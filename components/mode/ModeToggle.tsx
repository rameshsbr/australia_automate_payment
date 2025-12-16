"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { switchPathPrefix, modeFromPathname } from "@/lib/mode";

export default function ModeToggle() {
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const router = useRouter();
  const isSandbox = modeFromPathname(pathname) === "sandbox";

  function toggle() {
    const target = switchPathPrefix(pathname, isSandbox ? "live" : "sandbox");
    const qs = search.toString();
    document.cookie = `mode=${isSandbox ? "live" : "sandbox"}; path=/; SameSite=Lax`;
    router.push(qs ? `${target}?${qs}` : target);
  }

  return (
    <button
      aria-label="Sandbox toggle"
      onClick={toggle}
      className={`relative w-10 h-6 rounded-full border transition ${
        isSandbox ? "bg-[#6d44c9]" : "bg-panel"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
          isSandbox ? "left-[1.4rem]" : "left-0.5"
        }`}
      />
    </button>
  );
}
