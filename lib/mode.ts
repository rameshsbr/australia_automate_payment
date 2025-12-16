export type AppMode = "sandbox" | "live";

/** returns "sandbox" if pathname begins with /sandbox, else "live" */
export function modeFromPathname(pathname: string): AppMode {
  return pathname.startsWith("/sandbox") ? "sandbox" : "live";
}

/** add/remove the /sandbox prefix for the same logical path */
export function switchPathPrefix(pathname: string, to: AppMode): string {
  const noQS = pathname; // pathname only (caller keeps search params)
  const strip = noQS.replace(/^\/sandbox(?=\/|$)/, "");
  return to === "sandbox" ? `/sandbox${strip || "/"}` : strip || "/";
}
