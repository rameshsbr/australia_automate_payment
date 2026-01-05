"use client";

import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";

type Env = "sandbox" | "live";

function useEnvFromPath(): Env {
  const pathname = usePathname() || "/";
  return pathname.startsWith("/sandbox") ? "sandbox" : "live";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-outline/40 rounded-xl2 p-4 space-y-3">
      <div className="text-sm font-medium">{title}</div>
      {children}
    </div>
  );
}

export default function DeveloperToolsPage() {
  const env = useEnvFromPath();

  const [pingOut, setPingOut] = useState<string>("No result yet.");
  const [abn, setAbn] = useState("51824753556");
  const [abnOut, setAbnOut] = useState<string>("No result yet.");
  const [bsb, setBsb] = useState("062000");
  const [bsbOut, setBsbOut] = useState<string>("No result yet.");
  const [emailOut, setEmailOut] = useState<string>("No result yet.");
  const [busy, setBusy] = useState(false);

  const headers = useMemo(() => ({ "Content-Type": "application/json" }), []);

  async function runPing() {
    setBusy(true);
    try {
      const r = await fetch(`/api/monoova/tools/ping?env=${env}`, { cache: "no-store" });
      const t = await r.text();
      setPingOut(t || "(empty)");
    } catch (e: any) {
      setPingOut(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function runAbn() {
    setBusy(true);
    try {
      const r = await fetch(`/api/monoova/tools/abn/${encodeURIComponent(abn)}?env=${env}`, { cache: "no-store" });
      const t = await r.text();
      setAbnOut(t || "(empty)");
    } catch (e: any) {
      setAbnOut(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function runBsb() {
    setBusy(true);
    try {
      const r = await fetch(`/api/monoova/tools/bsb/${encodeURIComponent(bsb)}?env=${env}`, { cache: "no-store" });
      const t = await r.text();
      setBsbOut(t || "(empty)");
    } catch (e: any) {
      setBsbOut(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function sendEmailIssuer() {
    setBusy(true);
    try {
      const r = await fetch(`/api/monoova/tools/email-issuer?env=${env}`, {
        method: "POST",
        headers,
        body: JSON.stringify({}), // minimal payload
      });
      const t = await r.text();
      setEmailOut(t || "(empty)");
    } catch (e: any) {
      setEmailOut(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Title row (env chip & hint removed) */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Tools</h1>
      </div>

      <Section title="Ping">
        <div className="flex items-center gap-3">
          <button
            onClick={runPing}
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
            disabled={busy}
          >
            Run ping
          </button>
        </div>
        <pre className="text-xs bg-panel border border-outline/40 rounded p-3 overflow-auto">
{pingOut}
        </pre>
      </Section>

      <Section title="ABN lookup">
        <div className="flex items-center gap-2">
          <input
            className="w-[280px] bg-panel border border-outline/40 rounded px-2 py-1 text-sm"
            value={abn}
            onChange={(e) => setAbn(e.target.value)}
            placeholder="ABN e.g. 51824753556"
            inputMode="numeric"
          />
          <button
            onClick={runAbn}
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
            disabled={busy}
          >
            Lookup
          </button>
        </div>
        <pre className="text-xs bg-panel border border-outline/40 rounded p-3 overflow-auto">
{abnOut}
        </pre>
      </Section>

      <Section title="BSB lookup">
        <div className="flex items-center gap-2">
          <input
            className="w-[160px] bg-panel border border-outline/40 rounded px-2 py-1 text-sm"
            value={bsb}
            onChange={(e) => setBsb(e.target.value)}
            placeholder="BSB e.g. 062000"
            inputMode="numeric"
          />
          <button
            onClick={runBsb}
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
            disabled={busy}
          >
            Lookup
          </button>
        </div>
        <pre className="text-xs bg-panel border border-outline/40 rounded p-3 overflow-auto">
{bsbOut}
        </pre>
      </Section>

      <Section title="Email issuer">
        <div className="text-xs text-subt">
          Posts a minimal payload to <code className="font-mono">/api/monoova/tools/email-issuer</code>.
        </div>
        <button
          onClick={sendEmailIssuer}
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
          disabled={busy}
        >
          Send
        </button>
        <pre className="text-xs bg-panel border border-outline/40 rounded p-3 overflow-auto">
{emailOut}
        </pre>
      </Section>
    </div>
  );
}