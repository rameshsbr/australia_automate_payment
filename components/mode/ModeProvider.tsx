"use client";
import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { modeFromPathname, type AppMode } from "@/lib/mode";

const ModeCtx = createContext<AppMode>("live");
export const useAppMode = () => useContext(ModeCtx);

export default function ModeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = useMemo(() => modeFromPathname(pathname || "/"), [pathname]);
  return <ModeCtx.Provider value={mode}>{children}</ModeCtx.Provider>;
}
