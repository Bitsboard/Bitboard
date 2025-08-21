"use client";

import { useUnit } from "@/lib/settings";

export function UnitToggle() {
  const { unit, setUnit } = useUnit();

  return (
    <div className="relative inline-flex rounded-2xl p-1 shadow-lg border border-neutral-300/50 backdrop-blur-sm bg-white/70 dark:bg-neutral-800/60">
      <div
        className={`absolute inset-1 rounded-xl bg-white shadow-md transition-all duration-300 ease-out ${unit === 'BTC' ? 'translate-x-full' : 'translate-x-0'
          }`}
        style={{ width: 'calc(50% - 4px)' }}
      />
      <button
        onClick={() => setUnit('sats')}
        className={`relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 ${unit === 'sats'
            ? 'text-blue-600 font-extrabold'
            : 'text-neutral-600 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-50'
          }`}
        title="Display prices in sats"
      >
        sats
      </button>
      <button
        onClick={() => setUnit('BTC')}
        className={`relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 ${unit === 'BTC'
            ? 'text-blue-600 font-extrabold'
            : 'text-neutral-600 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-50'
          }`}
        title="Display prices in BTC"
      >
        BTC
      </button>
    </div>
  );
}
