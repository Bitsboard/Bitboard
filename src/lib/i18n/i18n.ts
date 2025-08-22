// React-free i18n utilities (safe in server and client)
import { commonTranslations } from './common';
import { homepageTranslations } from './homepage';

export type Lang = "en" | "fr" | "es" | "de";

// Merge all translations
const dictionaries: Record<Lang, Record<string, string>> = {
    en: {
        ...commonTranslations.en,
        ...homepageTranslations.en,
        // Additional translations that haven't been modularized yet
        seller_listings: "Seller Listings",
        buyer_listings: "Buyer Listings",
        // Add more as needed
    },
    fr: {
        ...commonTranslations.fr,
        ...homepageTranslations.fr,
        // Additional translations
        seller_listings: "Annonces du vendeur",
        buyer_listings: "Annonces de l'acheteur",
    },
    es: {
        ...commonTranslations.es,
        ...homepageTranslations.es,
        // Additional translations
        seller_listings: "Listas del vendedor",
        buyer_listings: "Listas del comprador",
    },
    de: {
        ...commonTranslations.de,
        ...homepageTranslations.de,
        // Additional translations
        seller_listings: "Verkäufer-Anzeigen",
        buyer_listings: "Käufer-Anzeigen",
    },
};

let currentLang: Lang = 'en';
if (typeof window !== 'undefined') {
    try {
        const saved = localStorage.getItem('lang') as Lang | null;
        if (saved && dictionaries[saved]) currentLang = saved; else {
            const nav = navigator.language.toLowerCase();
            if (nav.startsWith('fr')) currentLang = 'fr';
            else if (nav.startsWith('es')) currentLang = 'es';
            else if (nav.startsWith('de')) currentLang = 'de';
        }
        document.documentElement.lang = currentLang;
    } catch { }
}

const listeners = new Set<() => void>();

function emit() {
    for (const l of Array.from(listeners)) l();
}

export function getLang(): Lang {
    return currentLang;
}

export function setLang(lang: Lang) {
    currentLang = lang;
    try { localStorage.setItem('lang', lang); } catch { }
    if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
    }
    emit();
}

export function subscribeLang(fn: () => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
}

export function t(key: string, lang?: Lang): string {
    const l = lang || currentLang;
    return dictionaries[l][key] ?? dictionaries.en[key] ?? key;
}

export function formatPostedAgo(ts: number, lang?: Lang): string {
    const l = lang || currentLang;
    const now = Date.now();
    const diffMs = Math.max(0, now - ts);
    const minutes = Math.floor(diffMs / (60 * 1000));
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    function en(): string {
        if (days >= 1) return `Posted ${days} day${days === 1 ? '' : 's'} ago`;
        if (hours >= 1) return `Posted ${hours} hour${hours === 1 ? '' : 's'} ago`;
        const m = Math.max(1, minutes);
        return `Posted ${m} minute${m === 1 ? '' : 's'} ago`;
    }

    function fr(): string {
        if (days >= 1) return `Publié il y a ${days} jour${days === 1 ? '' : 's'}`;
        if (hours >= 1) return `Publié il y a ${hours} heure${hours === 1 ? '' : 's'}`;
        const m = Math.max(1, minutes);
        return `Publié il y a ${m} minute${m === 1 ? '' : 's'}`;
    }

    function es(): string {
        if (days >= 1) return `Publicado hace ${days} día${days === 1 ? '' : 's'}`;
        if (hours >= 1) return `Publicado hace ${hours} hora${hours === 1 ? '' : 's'}`;
        const m = Math.max(1, minutes);
        return `Publicado hace ${m} minuto${m === 1 ? '' : 's'}`;
    }

    function de(): string {
        if (days >= 1) return `Veröffentlicht vor ${days} Tag${days === 1 ? '' : 'en'}`;
        if (hours >= 1) return `Veröffentlicht vor ${hours} Stunde${hours === 1 ? '' : 'n'}`;
        const m = Math.max(1, minutes);
        return `Veröffentlicht vor ${m} Minute${m === 1 ? '' : 'n'}`;
    }

    if (l === 'fr') return fr();
    if (l === 'es') return es();
    if (l === 'de') return de();
    return en();
}

// Explicit named exports for bundlers
export { dictionaries as _dict_debug };
