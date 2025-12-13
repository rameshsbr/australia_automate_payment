"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Env = "SANDBOX" | "LIVE";
type Ctx = { env: Env; setEnv: (e: Env) => void };
const EnvCtx = createContext<Ctx>({ env: "SANDBOX", setEnv: () => {} });

export function EnvProvider({ children }: { children: React.ReactNode }) {
  const [env, setEnv] = useState<Env>("SANDBOX");
  useEffect(() => {
    const saved = localStorage.getItem("env") as Env | null;
    if (saved) setEnv(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("env", env);
    document.cookie = `env=${env}; path=/; samesite=lax`;
  }, [env]);
  return <EnvCtx.Provider value={{ env, setEnv }}>{children}</EnvCtx.Provider>;
}
export const useEnv = () => useContext(EnvCtx);
