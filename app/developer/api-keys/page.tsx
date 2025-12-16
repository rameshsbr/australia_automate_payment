"use client";

export default function ApiKeys() {
  return (
    <div className="space-y-6">
      <section className="bg-panel border border-outline/40 rounded-xl2">
        <div className="p-4 border-b border-outline/40 text-sm font-medium">API gateway</div>
        <div className="p-4 grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-surface border border-outline/40 rounded-lg p-3 flex items-center justify-between">
            <div>API gateway access</div>
            <div className="opacity-70">Enabled</div>
          </div>
          <div className="bg-surface border border-outline/40 rounded-lg p-3 flex items-center justify-between">
            <div>API gateway key</div>
            <div className="opacity-70">••••••••••••••••</div>
          </div>
        </div>
      </section>

      <section className="bg-panel border border-outline/40 rounded-xl2">
        <div className="p-4 border-b border-outline/40 text-sm font-medium">API credentials</div>
        <div className="p-4">
          <div className="bg-surface border border-outline/40 rounded-lg p-3 flex items-center justify-between">
            <div>Account API key</div>
            <div className="opacity-70">••••••••••••••••••••••••••••••••</div>
          </div>
          <div className="mt-3 text-right">
            <button className="inline-flex items-center bg-[#b53b3b] rounded-lg px-3 h-9 text-sm opacity-90 hover:opacity-100">
              ↻ Roll API key
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
