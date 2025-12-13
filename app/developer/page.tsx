import { AppShell } from "@/components/chrome";
import { env } from "@/lib/env";

export default function DevPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Developer</h1>
      <div className="bg-panel rounded-xl2 p-6 border border-outline/40">
        <div className="space-y-4 text-sm">
          <p>Your base URL for clients (clone API): <code className="px-2 py-1 bg-surface rounded">{env.publicApiBase}</code></p>
          <p>Auth: include header <code className="px-2 py-1 bg-surface rounded">x-api-key: &lt;your_key&gt;</code></p>
          <p>Paths & payloads mirror the upstream provider 1:1.</p>
          <p>Environment is determined by the assigned API key (Sandbox/Live).</p>
        </div>
      </div>
    </AppShell>
  );
}
