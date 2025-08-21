"use client";

import { useLayout } from "@/lib/settings";

export function ViewToggle() {
  const { layout, setLayout } = useLayout();

  return (
    <div className="relative inline-flex rounded-2xl p-1 shadow-lg border border-neutral-300/50 backdrop-blur-sm bg-white/70 dark:bg-neutral-800/60">
      <div
        className={`absolute inset-1 rounded-xl bg-white shadow-md transition-all duration-300 ease-out ${layout === 'list' ? 'translate-x-full' : 'translate-x-0'
          }`}
        style={{ width: 'calc(50% - 4px)' }}
      />
      <button
        onClick={() => setLayout('grid')}
        className={`relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 ${layout === 'grid'
            ? 'text-blue-600 font-extrabold'
            : 'text-neutral-600 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-50'
          }`}
        title="Grid view"
      >
        Grid
      </button>
      <button
        onClick={() => setLayout('list')}
        className={`relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 ${layout === 'list'
            ? 'text-blue-600 font-extrabold'
            : 'text-neutral-600 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-50'
          }`}
        title="List view"
      >
        List
      </button>
    </div>
  );
}
