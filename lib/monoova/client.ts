import { cookies } from "next/headers";

type Mode = "MOCK" | "SANDBOX" | "LIVE";

function getMode(): Mode {
  try {
    const v = cookies().get("env")?.value?.toUpperCase();
    if (v === "LIVE") return "LIVE";
    if (v === "MOCK") return "MOCK";
  } catch {
    // ignore header access failures
  }
  return "SANDBOX";
}

function baseFor(mode: Mode) {
  if (mode === "MOCK") return process.env.MONOOVA_BASE_MOCK || "http://localhost:4010";
  if (mode === "LIVE") return process.env.MONOOVA_BASE_LIVE || "https://api.mpay.com.au";
  return process.env.MONOOVA_BASE_SANDBOX || "https://api.m-pay.com.au";
}

function apiKeyFor(mode: Mode) {
  return mode === "LIVE"
    ? process.env.MONOOVA_API_KEY_LIVE || ""
    : process.env.MONOOVA_API_KEY_SANDBOX || "";
}

function basicHeader(apiKey: string) {
  return "Basic " + Buffer.from(`${apiKey}:`).toString("base64");
}

export async function fetchMonoova(
  path: string,
  init: RequestInit & { modeOverride?: Mode } = {}
) {
  const mode = init.modeOverride ?? getMode();
  const base = baseFor(mode);
  const url = `${base}${path}`;

  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (mode !== "MOCK") {
    headers.authorization = basicHeader(apiKeyFor(mode));
  }

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return { status: res.status, json, headers: res.headers, url };
}
