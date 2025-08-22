"use client";

import { useLayout } from "@/lib/settings";

export function ViewToggle() {
  const { layout, setLayout } = useLayout();

  return (
    <div className="relative inline-flex rounded-2xl p-1 shadow-lg border backdrop-blur-sm bg-white/70 dark:bg-neutral-800/60 dark:border-neutral-700/50">
      <div
        className={`absolute inset-1 rounded-xl transition-all duration-300 ease-out ${
          layout === 'list' 
            ? 'translate-x-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg' 
            : 'translate-x-0 bg-gradient-to-r from-orange-400 to-orange-500 shadow-lg'
        }`}
        style={{ width: 'calc(50% - 4px)' }}
      />
      <button
        onClick={() => setLayout('grid')}
        className={`relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 ${
          layout === 'grid'
            ? 'text-white font-extrabold drop-shadow-sm'
            : 'text-neutral-600 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-50'
        }`}
        title="Grid view"
      >
        Grid
      </button>
      <button
        onClick={() => setLayout('list')}
        className={`relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 ${
          layout === 'list'
            ? 'text-white font-extrabold drop-shadow-sm'
            : 'text-neutral-600 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-50'
        }`}
        title="List view"
      >
        List
      </button>
    </div>
  );
}
