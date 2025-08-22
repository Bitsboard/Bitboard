"use client";

import { useUnit } from "@/lib/settings";

export function UnitToggle() {
  const { unit, setUnit } = useUnit();

  return (
    <div className="relative inline-flex rounded-2xl p-1 shadow-lg border backdrop-blur-sm bg-white/70 dark:bg-neutral-800/60 dark:border-neutral-700/50">
      <div
        className={`absolute inset-1 rounded-xl transition-all duration-300 ease-out ${
          unit === 'BTC' 
            ? 'translate-x-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg' 
            : 'translate-x-0 bg-gradient-to-r from-orange-400 to-orange-500 shadow-lg'
        }`}
        style={{ width: 'calc(50% - 4px)' }}
      />
      <button
        onClick={() => setUnit('sats')}
        className={`relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 ${
          unit === 'sats'
            ? 'text-white font-extrabold drop-shadow-sm'
            : 'text-neutral-600 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-50'
        }`}
        title="Display prices in sats"
      >
        sats
      </button>
      <button
        onClick={() => setUnit('BTC')}
        className={`relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 ${
          unit === 'BTC'
            ? 'text-white font-extrabold drop-shadow-sm'
            : 'text-neutral-600 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-50'
        }`}
        title="Display prices in BTC"
      >
        BTC
      </button>
    </div>
  );
}
