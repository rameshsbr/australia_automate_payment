import { AppShell } from "@/components/chrome";

export default async function SummaryPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Organisation summary</h1>
      <section className="mb-6">
        <h2 className="text-base text-subt mb-2">Domestic payment accounts</h2>
        <div className="bg-panel rounded-xl2 shadow-soft border border-outline/40">
          <div className="p-4 border-b border-outline/30">
            <input className="w-full bg-transparent outline-none text-sm text-subt placeholder:text-subt/70" placeholder="Search accounts by name…"/>
          </div>
          <div className="p-2">
            <div className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-surface/50">
              <div>
                <div className="text-sm">—</div>
                <div className="text-xs text-subt">#—</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-subt">Available</div>
                <div className="text-lg font-semibold">—</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-panel rounded-xl2 shadow-soft border border-outline/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base">Other services</h3>
            <span className="text-subt text-sm">Foreign exchange</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="text-2xl mb-2">🌐</div>
            <div className="font-medium">Receive and manage foreign currencies</div>
            <div className="text-subt text-sm mt-1">Get in touch to set up a foreign exchange account</div>
            <button className="mt-6 inline-flex items-center gap-2 text-sm bg-surface border border-outline/40 rounded-lg px-4 py-2 hover:bg-surface/70">
              💬 Speak with your Relationship Manager to set up foreign exchange
            </button>
          </div>
        </div>
        <div className="bg-panel rounded-xl2 shadow-soft border border-outline/40 p-6">
          <div className="text-base mb-6">Support</div>
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="text-2xl mb-2">🛟</div>
            <div className="font-medium">Get support</div>
            <div className="text-subt text-sm mt-1">Submit or track support requests in Service Desk</div>
            <button className="mt-6 inline-flex items-center gap-2 text-sm bg-surface border border-outline/40 rounded-lg px-4 py-2 hover:bg-surface/70">
              🔗 Open Service Desk
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
