"use client";

export function FooterPagination() {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm text-subt">
      <div>Showing 0 – 0 of 0</div>
      <div className="flex items-center gap-2">
        <button className="w-7 h-7 rounded border border-outline/40 text-subt hover:bg-panel/60">‹</button>
        <button className="w-7 h-7 rounded border border-outline/40 text-subt hover:bg-panel/60">›</button>
      </div>
    </div>
  );
}

export function EmptyStatePanel({
  icon = "▢",
  title,
  subtitle,
  cta
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="bg-panel rounded-xl2 border border-outline/40 p-6">
      <div className="py-16 text-center">
        <div className="text-2xl mb-2">{icon}</div>
        <div className="font-medium text-white">{title}</div>
        {subtitle ? <div className="text-sm text-subt mt-1">{subtitle}</div> : null}
        {cta ? <div className="mt-4">{cta}</div> : null}
      </div>
    </div>
  );
}

export function LockPanel({
  title,
  message,
  buttonText
}: {
  title: string;
  message: string;
  buttonText: string;
}) {
  return (
    <div className="bg-panel rounded-xl2 border border-outline/40 p-6">
      <div className="py-16 text-center">
        <div className="text-2xl mb-2">🔒</div>
        <div className="font-medium text-white">{title}</div>
        <div className="text-sm text-subt mt-1">{message}</div>
        <button className="mt-6 inline-flex items-center gap-2 text-sm bg-surface border border-outline/40 rounded-lg px-4 py-2 hover:bg-surface/70">
          💬 {buttonText}
        </button>
      </div>
    </div>
  );
}
