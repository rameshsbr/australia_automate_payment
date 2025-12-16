import { NextRequest } from "next/server";
import { AppMode, modeFromPathname } from "./mode";

function base(mode: AppMode) {
  return mode === "sandbox" ? process.env.SANDBOX_API_BASE! : process.env.LIVE_API_BASE!;
}

export function apiBaseFromRequest(req: NextRequest) {
  const mode = modeFromPathname(req.nextUrl.pathname);
  return base(mode);
}

export function apiBaseFromPathname(pathname: string) {
  return base(modeFromPathname(pathname));
}
