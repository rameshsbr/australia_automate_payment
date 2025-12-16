"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewAutomatcherPage() {
  const router = useRouter();
  const [bsb, setBsb] = useState("802-985");
  const [altNames, setAltNames] = useState<string[]>([""]);
  const [clientId, setClientId] = useState("");
  const [active, setActive] = useState(true);

  const addAltName = () => setAltNames((list) => [...list, ""]);
  const updateAltName = (idx: number, value: string) =>
    setAltNames((list) => list.map((entry, i) => (i === idx ? value : entry)));
  const removeAltName = (idx: number) => setAltNames((list) => list.filter((_, i) => i !== idx));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/automatchers");
  };

  return (
    <>
      <div className="mb-6">
        <Link href="/automatchers" className="text-sm text-subt hover:text-white">
          ← Automatchers
        </Link>
        <h1 className="text-2xl font-semibold mt-2">New Automatcher</h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="max-w-xl bg-panel border border-outline/40 rounded-2xl p-5 space-y-5"
      >
        <div>
          <label className="block text-sm mb-1">BSB</label>
          <select
            value={bsb}
            onChange={(e) => setBsb(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-surface border border-outline/40 text-sm"
          >
            <option value="802-985">802-985</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Alternative account name</label>
          <div className="space-y-2">
            {altNames.map((value, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={value}
                  onChange={(e) => updateAltName(idx, e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg bg-surface border border-outline/40 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeAltName(idx)}
                  className="h-10 px-3 rounded-lg bg-panel border border-outline/40 text-sm"
                  aria-label="Remove alternative account name"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addAltName} className="mt-2 text-sm text-[#b9a5ff]">
            + Add alternative account name
          </button>
        </div>

        <div>
          <label className="block text-sm mb-1">
            Client unique ID <span className="text-subt">(optional)</span>
          </label>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-surface border border-outline/40 text-sm"
          />
          <p className="text-xs text-subt mt-1">Must be between 10 to 35 alphanumeric characters</p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span>Activate account</span>
          <span className="text-subt">It may take a few minutes for the account to be activated.</span>
        </label>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push("/automatchers")}
            className="h-10 px-4 rounded-lg bg-panel border border-outline/40 text-sm"
          >
            Cancel
          </button>
          <button type="submit" className="h-10 px-5 rounded-lg bg-[#6d44c9] text-sm">
            Save
          </button>
        </div>
      </form>
    </>
  );
}
