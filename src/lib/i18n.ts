export type Lang = "en" | "fr" | "es" | "de";

const dictionaries: Record<Lang, Record<string, string>> = {
	en: {
		search: "Search",
		location: "Location",
		change: "Change",
		change_ellipsis: "Change…",
		all_listings: "All Listings",
		seller_listings: "Seller Listings",
		buyer_listings: "Buyer Listings",
		category: "Category",
		type: "Type",
		price_sats: "Price (sats)",
		price_btc: "Price (BTC)",
		min: "Min",
		max: "Max",
		newest: "Newest",
		oldest: "Oldest",
		highest_price: "Highest Price",
		lowest_price: "Lowest Price",
		closest: "Closest",
		no_results: "No results found",
		try_different: "Try different keywords or clear filters",
		apply: "Apply",
		clear_all: "Clear all",
		cancel: "Cancel",
		close: "Close",
		change_location: "Change location",
		radius: "Radius",
		enter_city: "Enter a city",
		title_hero_1: "Get better deals,",
		title_hero_2: "use better money.",
		how_it_works: "How it works",
		pricing: "Pricing",
		post_listing: "Post a listing",
		sign_in: "Sign in",
	},
	fr: {
		search: "Rechercher",
		location: "Lieu",
		change: "Modifier",
		change_ellipsis: "Modifier…",
		all_listings: "Toutes les annonces",
		seller_listings: "Annonces vendeur",
		buyer_listings: "Annonces acheteur",
		category: "Catégorie",
		type: "Type",
		price_sats: "Prix (sats)",
		price_btc: "Prix (BTC)",
		min: "Min",
		max: "Max",
		newest: "Plus récentes",
		oldest: "Plus anciennes",
		highest_price: "Prix le plus élevé",
		lowest_price: "Prix le plus bas",
		closest: "Le plus proche",
		no_results: "Aucun résultat",
		try_different: "Essayez d'autres mots-clés ou réinitialisez les filtres",
		apply: "Appliquer",
		clear_all: "Tout effacer",
		cancel: "Annuler",
		close: "Fermer",
		change_location: "Changer de lieu",
		radius: "Rayon",
		enter_city: "Entrez une ville",
		title_hero_1: "Faites de meilleures affaires,",
		title_hero_2: "utilisez une meilleure monnaie.",
		how_it_works: "Comment ça marche",
		pricing: "Tarifs",
		post_listing: "Publier une annonce",
		sign_in: "Se connecter",
	},
	es: {
		search: "Buscar",
		location: "Ubicación",
		change: "Cambiar",
		change_ellipsis: "Cambiar…",
		all_listings: "Todos los anuncios",
		seller_listings: "Anuncios del vendedor",
		buyer_listings: "Anuncios del comprador",
		category: "Categoría",
		type: "Tipo",
		price_sats: "Precio (sats)",
		price_btc: "Precio (BTC)",
		min: "Mín",
		max: "Máx",
		newest: "Más recientes",
		oldest: "Más antiguas",
		highest_price: "Precio más alto",
		lowest_price: "Precio más bajo",
		closest: "Más cercano",
		no_results: "No se encontraron resultados",
		try_different: "Prueba otras palabras clave o limpia los filtros",
		apply: "Aplicar",
		clear_all: "Borrar todo",
		cancel: "Cancelar",
		close: "Cerrar",
		change_location: "Cambiar ubicación",
		radius: "Radio",
		enter_city: "Ingrese una ciudad",
		title_hero_1: "Consigue mejores ofertas,",
		title_hero_2: "usa mejor dinero.",
		how_it_works: "Cómo funciona",
		pricing: "Precios",
		post_listing: "Publicar anuncio",
		sign_in: "Iniciar sesión",
	},
	de: {
		search: "Suche",
		location: "Ort",
		change: "Ändern",
		change_ellipsis: "Ändern…",
		all_listings: "Alle Anzeigen",
		seller_listings: "Verkäuferanzeigen",
		buyer_listings: "Käuferanzeigen",
		category: "Kategorie",
		type: "Typ",
		price_sats: "Preis (sats)",
		price_btc: "Preis (BTC)",
		min: "Min",
		max: "Max",
		newest: "Neueste",
		oldest: "Älteste",
		highest_price: "Höchster Preis",
		lowest_price: "Niedrigster Preis",
		closest: "Nächste",
		no_results: "Keine Ergebnisse",
		try_different: "Versuche andere Suchbegriffe oder lösche Filter",
		apply: "Anwenden",
		clear_all: "Alle löschen",
		cancel: "Abbrechen",
		close: "Schließen",
		change_location: "Standort ändern",
		radius: "Radius",
		enter_city: "Stadt eingeben",
		title_hero_1: "Bessere Angebote,",
		title_hero_2: "nutze besseres Geld.",
		how_it_works: "So funktioniert's",
		pricing: "Preise",
		post_listing: "Anzeige einstellen",
		sign_in: "Anmelden",
	},
};

export function getLang(): Lang {
	if (typeof window === 'undefined') return 'en';
	const saved = localStorage.getItem('lang') as Lang | null;
	if (saved && dictionaries[saved]) return saved;
	const nav = navigator.language.toLowerCase();
	if (nav.startsWith('fr')) return 'fr';
	if (nav.startsWith('es')) return 'es';
	if (nav.startsWith('de')) return 'de';
	return 'en';
}

export function setLang(lang: Lang) {
	try { localStorage.setItem('lang', lang); } catch { }
	if (typeof document !== 'undefined') {
		document.documentElement.lang = lang;
	}
}

export function t(key: string, lang?: Lang): string {
	const l = lang || getLang();
	return dictionaries[l][key] ?? dictionaries.en[key] ?? key;
}


