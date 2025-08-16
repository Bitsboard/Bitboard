export type Lang = "en" | "fr" | "es" | "de";

const dict: Record<Lang, Record<string, string>> = {
  en: {
    search: "Search",
    newest: "Newest",
    oldest: "Oldest",
    highest_price: "Highest Price",
    lowest_price: "Lowest Price",
    closest: "Closest",
    all_listings: "All Listings",
    selling: "Selling",
    looking_for: "Looking For",
    category: "Category",
    type: "Type",
    price_sats: "Price (sats)",
    price_btc: "Price (BTC)",
    apply: "Apply",
    clear_all: "Clear all",
    no_results: "No results found",
    try_diff: "Try different keywords or clear filters",
    featured: "Featured",
    latest: "Latest",
  },
  fr: {
    search: "Rechercher",
    newest: "Plus récent",
    oldest: "Plus ancien",
    highest_price: "Prix le plus élevé",
    lowest_price: "Prix le plus bas",
    closest: "Le plus proche",
    all_listings: "Toutes les annonces",
    selling: "Vente",
    looking_for: "Recherche",
    category: "Catégorie",
    type: "Type",
    price_sats: "Prix (sats)",
    price_btc: "Prix (BTC)",
    apply: "Appliquer",
    clear_all: "Tout effacer",
    no_results: "Aucun résultat",
    try_diff: "Essayez d'autres mots-clés ou réinitialisez les filtres",
    featured: "En vedette",
    latest: "Récents",
  },
  es: {
    search: "Buscar",
    newest: "Más reciente",
    oldest: "Más antiguo",
    highest_price: "Mayor precio",
    lowest_price: "Menor precio",
    closest: "Más cercano",
    all_listings: "Todos los anuncios",
    selling: "En venta",
    looking_for: "Busco",
    category: "Categoría",
    type: "Tipo",
    price_sats: "Precio (sats)",
    price_btc: "Precio (BTC)",
    apply: "Aplicar",
    clear_all: "Borrar todo",
    no_results: "Sin resultados",
    try_diff: "Prueba otras palabras clave o limpia los filtros",
    featured: "Destacados",
    latest: "Últimos",
  },
  de: {
    search: "Suchen",
    newest: "Neueste",
    oldest: "Älteste",
    highest_price: "Höchster Preis",
    lowest_price: "Niedrigster Preis",
    closest: "Nächstgelegen",
    all_listings: "Alle Anzeigen",
    selling: "Verkauf",
    looking_for: "Suche",
    category: "Kategorie",
    type: "Typ",
    price_sats: "Preis (sats)",
    price_btc: "Preis (BTC)",
    apply: "Anwenden",
    clear_all: "Alles löschen",
    no_results: "Keine Ergebnisse",
    try_diff: "Andere Schlüsselwörter versuchen oder Filter löschen",
    featured: "Empfohlen",
    latest: "Neu",
  },
};

export function getLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = (localStorage.getItem("lang") || "en") as Lang;
  return ("en fr es de" as string).includes(v) ? v : "en";
}

export function t(key: string, lang?: Lang): string {
  const l = lang ?? getLang();
  return dict[l][key] ?? dict.en[key] ?? key;
}


