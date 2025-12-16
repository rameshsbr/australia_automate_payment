import { NextResponse } from "next/server";
import { modeFromPathname } from "@/lib/mode";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = modeFromPathname(url.pathname);
  return NextResponse.json({ mode });
}
