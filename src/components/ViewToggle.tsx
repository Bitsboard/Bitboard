"use client";

import { cn } from "@/lib/utils";
import { useLayout } from "@/lib/settings";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";

export function ViewToggle() {
  const { layout, setLayout } = useLayout();
  const lang = useLang();

  return (
    <div className="relative inline-flex rounded-2xl bg-neutral-200/50 p-0.5 shadow-lg border border-neutral-300/50 backdrop-blur-sm">
      <div
        className={cn(
          "absolute inset-1 rounded-xl bg-white shadow-md transition-all duration-300 ease-out",
          layout === "grid" ? "translate-x-0" : "translate-x-full"
        )}
        style={{ width: 'calc(50% - 4px)' }}
      />
      <button
        onClick={() => setLayout("grid")}
        className={cn(
          "relative z-10 px-4 py-1 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105",
          layout === "grid"
            ? "text-orange-700 font-extrabold"
            : "text-neutral-600 hover:text-neutral-700"
        )}
        title="Grid View"
      >
        <span className="text-lg">⊞</span>
        <span>{t('grid', lang)}</span>
      </button>
      <button
        onClick={() => setLayout("list")}
        className={cn(
          "relative z-10 px-4 py-1 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105",
          layout === "list"
            ? "text-orange-700 font-extrabold"
            : "text-neutral-600 hover:text-neutral-700"
        )}
        title="List View"
      >
        <span className="text-lg">☰</span>
        <span>{t('list', lang)}</span>
      </button>
    </div>
  );
}
