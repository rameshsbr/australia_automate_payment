import { cookies } from "next/headers";
import { basicForApiKey, monoovaConfig, type Mode } from "@/lib/monoova";

function cookieMode(): Mode {
  try {
    const v = cookies().get("env")?.value?.toUpperCase();
    if (v === "LIVE" || v === "MOCK") return v;
  } catch {
    // ignore
  }
  return "SANDBOX";
}

export async function fetchMonoova(
  path: string,
  init: RequestInit = {},
  mode: Mode = cookieMode()
) {
  const cfg = monoovaConfig(mode);
  const url = `${cfg.base}/${path.replace(/^\/+/, "")}`;

  const headers = new Headers(init.headers || {});
  if (!headers.has("authorization") && mode !== "MOCK") {
    headers.set("authorization", basicForApiKey(cfg.apiKey));
  }
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  if (!headers.has("accept")) headers.set("accept", "application/json");

  const body = (init as any).body;
  const reqInit: RequestInit = {
    method: init.method ?? "GET",
    headers,
    body:
      typeof body === "string"
        ? body
        : body !== undefined && init.method && init.method.toUpperCase() !== "GET"
        ? JSON.stringify(body)
        : undefined,
    cache: "no-store",
  };

  const res = await fetch(url, reqInit);
  const text = await res.text();
  const json = (() => {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  })();

  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), data: json };
}
