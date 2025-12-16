"use client";


export default function ForeignExchangePage() {
  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Foreign exchange</h1>

      <div className="bg-panel rounded-xl2 border border-outline/40 p-10 text-center text-subt">
        <div className="max-w-2xl mx-auto py-16">
          <div className="text-3xl mb-3">🔒</div>
          <div className="font-semibold text-white">Activate foreign exchange</div>

          <p className="text-sm mt-2 mb-6">
            Get wholesale rates, faster settlement and a dedicated dealer to help
            you manage your FX smoothly with Monoova.
          </p>

          <button
            className="inline-flex items-center gap-2 bg-surface border border-outline/40 rounded-lg px-4 py-2 text-sm hover:bg-surface/70"
            type="button"
          >
            <span>⚙️</span>
            <span>Speak with your Relationship Manager to set up foreign exchange</span>
          </button>
        </div>
      </div>
    </>
  );
}
