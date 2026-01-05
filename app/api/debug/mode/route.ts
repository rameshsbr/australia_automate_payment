import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type Env = "sandbox" | "live";

export async function GET() {
  const cookieEnv = cookies().get("env")?.value;
  const env: Env = cookieEnv === "live" ? "live" : "sandbox";
  return NextResponse.json({ env });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const next = String(body?.env || "").toLowerCase();
  const env: Env = next === "live" ? "live" : "sandbox";

  const res = NextResponse.json({ ok: true, env });
  res.cookies.set("env", env, {
    path: "/",
    sameSite: "lax",
    httpOnly: false, // readable by client for display if you want
    secure: false,   // set true in prod (HTTPS)
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}