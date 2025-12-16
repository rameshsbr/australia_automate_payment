import type React from "react";
import { AppShell } from "@/components/chrome";

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return <AppShell env="live">{children}</AppShell>;
}
