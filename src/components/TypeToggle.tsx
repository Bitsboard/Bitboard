"use client";

import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import type { AdType } from "@/lib/types";

interface TypeToggleProps {
  value: AdType;
  onChange: (value: AdType) => void;
  dark: boolean;
}

export function TypeToggle({ value, onChange, dark }: TypeToggleProps) {
  const lang = useLang();

  return (
    <div className={`relative inline-flex rounded-2xl p-1 shadow-lg border backdrop-blur-sm ${dark
        ? 'border-neutral-700/50 bg-neutral-800/60'
        : 'border-neutral-300/50 bg-white/70'
      }`}>
      <div
        className={`absolute inset-1 rounded-xl transition-all duration-300 ease-out ${dark ? 'bg-neutral-700 shadow-md' : 'bg-white shadow-md'
          } ${value === 'want' ? 'translate-x-full' : value === 'sell' ? 'translate-x-0' : 'translate-x-[50%]'
          }`}
        style={{ width: 'calc(33.333% - 4px)' }}
      />
      <button
        onClick={() => onChange('all')}
        className={`relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 ${value === 'all'
            ? 'text-blue-600 font-extrabold'
            : dark ? 'text-neutral-200 hover:text-neutral-50' : 'text-neutral-600 hover:text-neutral-800'
          }`}
        title={t('all_listings', lang)}
      >
        {t('all_listings', lang)}
      </button>
      <button
        onClick={() => onChange('sell')}
        className={`relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 ${value === 'sell'
            ? 'text-blue-600 font-extrabold'
            : dark ? 'text-neutral-200 hover:text-neutral-50' : 'text-neutral-600 hover:text-neutral-800'
          }`}
        title={t('selling', lang)}
      >
        {t('selling', lang)}
      </button>
      <button
        onClick={() => onChange('want')}
        className={`relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 ${value === 'want'
            ? 'text-blue-600 font-extrabold'
            : dark ? 'text-neutral-200 hover:text-neutral-50' : 'text-neutral-600 hover:text-neutral-800'
          }`}
        title={t('looking_for', lang)}
      >
        {t('looking_for', lang)}
      </button>
    </div>
  );
}
