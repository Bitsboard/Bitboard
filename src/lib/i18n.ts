import * as React from "react";

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
        // close already defined above in base keys; avoid duplicate
        change_location: "Change location",
        radius: "Radius",
        enter_city: "Enter a city",
        title_hero_1: "Find better deals,",
        title_hero_2: "use better money.",
        how_it_works: "How it works",
        pricing: "Pricing",
        post_listing: "Post a listing",
        sign_in: "Sign in",
        // Homepage
        subheading: "The Bitcoin-native marketplace",
        search_placeholder: "Search bikes, ASICs, consoles…",
        choose_location: "Choose location",
        featured: "Featured",
        latest: "Latest",
        services_label: "Services",
        no_goods_match: "No goods match your search",
        try_widen_radius: "Try widening your radius or clearing filters",
        no_services_match: "No services match your search",
        try_adjust_filters: "Try adjusting your filters",
        loading_more: "Loading more…",
        no_more_results: "No more results",
        selected_location: "Selected location",
        set_location: "Set location",
        // Footer
        prohibited_items: "Prohibited items",
        safety_tips: "Safety tips",
        terms: "Terms",
        footer_tagline: "⚡ Bitboard — in-app chat + Lightning escrow. Keep correspondence in-app; off-app contact is against our guidelines.",
        grid: "Grid",
        list: "List",
        description: "Description",
        report_listing: "Report listing",
        close: "Close",
        // Listing modal
        message_seller: "Message seller",
        send_message: "Send a Message",
        share_listing: "Share listing",
        listing_warning: "For safety, please keep all correspondence in-app.",
        results: "results",
        // Categories
        cat_all: "All",
        cat_electronics: "Electronics",
        cat_mining_gear: "Mining Gear",
        cat_home_garden: "Home & Garden",
        cat_sports_bikes: "Sports & Bikes",
        cat_tools: "Tools",
        cat_games_hobbies: "Games & Hobbies",
        cat_furniture: "Furniture",
        cat_services: "Services",
        // Menu
        menu_display_prices_in: "Display prices in:",
        menu_display_theme: "Display Theme:",
        menu_layout_view: "Layout View:",
        // Types (singular labels)
        selling: "Selling",
        looking_for: "Looking For",
        verified_tooltip: "User has verified their identity",
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
        // Homepage
        subheading: "Le marché natif Bitcoin",
        search_placeholder: "Rechercher vélos, ASICs, consoles…",
        choose_location: "Choisir un lieu",
        featured: "À la une",
        latest: "Récents",
        services_label: "Services",
        no_goods_match: "Aucune annonce ne correspond à votre recherche",
        try_widen_radius: "Essayez d'élargir votre rayon ou de réinitialiser les filtres",
        no_services_match: "Aucun service ne correspond à votre recherche",
        try_adjust_filters: "Essayez d'ajuster vos filtres",
        loading_more: "Chargement…",
        no_more_results: "Plus de résultats",
        selected_location: "Lieu sélectionné",
        set_location: "Définir le lieu",
        // Footer
        prohibited_items: "Objets interdits",
        safety_tips: "Conseils de sécurité",
        terms: "Conditions",
        footer_tagline: "⚡ Bitboard — messagerie intégrée + séquestre Lightning. Gardez les échanges dans l'application; le contact hors application est contraire à nos directives.",
        grid: "Grille",
        list: "Liste",
        description: "Description",
        report_listing: "Signaler l'annonce",
        // Listing modal
        message_seller: "Contacter le vendeur",
        send_message: "Envoyer un message",
        share_listing: "Partager l'annonce",
        listing_warning: "Gardez toutes les conversations dans l'application pour votre sécurité. Le contact hors application est contraire à nos directives. Lorsque vous êtes prêt, joignez une proposition d'entiercement depuis le composeur de discussion.",
        results: "résultats",
        // Categories
        cat_all: "Tous",
        cat_electronics: "Électronique",
        cat_mining_gear: "Matériel de minage",
        cat_home_garden: "Maison & Jardin",
        cat_sports_bikes: "Sports & Vélos",
        cat_tools: "Outils",
        cat_games_hobbies: "Jeux & Loisirs",
        cat_furniture: "Meubles",
        cat_services: "Services",
        // Menu
        menu_display_prices_in: "Afficher les prix en :",
        menu_display_theme: "Thème d'affichage :",
        menu_layout_view: "Affichage :",
        // Types (singular labels)
        selling: "Vente",
        looking_for: "Recherche",
        verified_tooltip: "L'utilisateur a vérifié son identité",
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
        // Homepage
        subheading: "El mercado nativo de Bitcoin",
        search_placeholder: "Buscar bicis, ASICs, consolas…",
        choose_location: "Elegir ubicación",
        featured: "Destacados",
        latest: "Recientes",
        services_label: "Servicios",
        no_goods_match: "No hay artículos que coincidan con tu búsqueda",
        try_widen_radius: "Prueba ampliando el radio o limpiando los filtros",
        no_services_match: "No hay servicios que coincidan con tu búsqueda",
        try_adjust_filters: "Prueba ajustando tus filtros",
        loading_more: "Cargando…",
        no_more_results: "No hay más resultados",
        selected_location: "Ubicación seleccionada",
        set_location: "Establecer ubicación",
        // Footer
        prohibited_items: "Artículos prohibidos",
        safety_tips: "Consejos de seguridad",
        terms: "Términos",
        footer_tagline: "⚡ Bitboard — chat en la app + escrow Lightning. Mantén la correspondencia en la app; el contacto fuera de la app va en contra de nuestras directrices.",
        grid: "Cuadrícula",
        list: "Lista",
        description: "Descripción",
        report_listing: "Reportar anuncio",
        // Listing modal
        message_seller: "Enviar mensaje al vendedor",
        send_message: "Enviar mensaje",
        share_listing: "Compartir anuncio",
        listing_warning: "Mantén toda la correspondencia en la app por seguridad. El contacto fuera de la app va en contra de nuestras directrices. Cuando estés listo, adjunta una propuesta de depósito desde el compositor del chat.",
        results: "resultados",
        // Categories
        cat_all: "Todos",
        cat_electronics: "Electrónica",
        cat_mining_gear: "Equipo de minería",
        cat_home_garden: "Hogar y Jardín",
        cat_sports_bikes: "Deportes y Bicis",
        cat_tools: "Herramientas",
        cat_games_hobbies: "Juegos y Aficiones",
        cat_furniture: "Muebles",
        cat_services: "Servicios",
        // Menu
        menu_display_prices_in: "Mostrar precios en:",
        menu_display_theme: "Tema de visualización:",
        menu_layout_view: "Vista de diseño:",
        // Types (singular labels)
        selling: "Venta",
        looking_for: "Se busca",
        verified_tooltip: "El usuario ha verificado su identidad",
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
        // Homepage
        subheading: "Der Bitcoin-native Marktplatz",
        search_placeholder: "Suche nach Fahrrädern, ASICs, Konsolen…",
        choose_location: "Ort wählen",
        featured: "Empfohlen",
        latest: "Neu",
        services_label: "Dienstleistungen",
        no_goods_match: "Keine Artikel entsprechen deiner Suche",
        try_widen_radius: "Vergrößere deinen Radius oder lösche Filter",
        no_services_match: "Keine Dienstleistungen entsprechen deiner Suche",
        try_adjust_filters: "Versuche, deine Filter anzupassen",
        loading_more: "Lade mehr…",
        no_more_results: "Keine weiteren Ergebnisse",
        selected_location: "Ausgewählter Ort",
        set_location: "Ort festlegen",
        // Footer
        prohibited_items: "Verbotene Artikel",
        safety_tips: "Sicherheitstipps",
        terms: "Bedingungen",
        footer_tagline: "⚡ Bitboard — In‑App‑Chat + Lightning‑Treuhand. Halte die Korrespondenz in der App; Kontakt außerhalb der App verstößt gegen unsere Richtlinien.",
        grid: "Raster",
        list: "Liste",
        description: "Beschreibung",
        report_listing: "Anzeige melden",
        // Listing modal
        message_seller: "Nachricht an Verkäufer",
        send_message: "Nachricht senden",
        share_listing: "Anzeige teilen",
        listing_warning: "Halte die gesamte Korrespondenz aus Sicherheitsgründen in der App. Kontakt außerhalb der App verstößt gegen unsere Richtlinien. Hänge eine Treuhandvorschlag aus dem Chat-Composer an, wenn du soweit bist.",
        results: "Ergebnisse",
        // Categories
        cat_all: "Alle",
        cat_electronics: "Elektronik",
        cat_mining_gear: "Mining-Ausrüstung",
        cat_home_garden: "Haus & Garten",
        cat_sports_bikes: "Sport & Fahrräder",
        cat_tools: "Werkzeuge",
        cat_games_hobbies: "Spiele & Hobbys",
        cat_furniture: "Möbel",
        cat_services: "Dienstleistungen",
        // Menu
        menu_display_prices_in: "Preise anzeigen in:",
        menu_display_theme: "Anzeige-Thema:",
        menu_layout_view: "Layout-Ansicht:",
        // Types (singular labels)
        selling: "Verkauf",
        looking_for: "Suche",
        verified_tooltip: "Benutzer hat seine Identität verifiziert",
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
    return () => listeners.delete(fn);
}

export function useLang(): Lang {
    // Use SyncExternalStore for concurrent-safe subscriptions
    // @ts-ignore
    return React.useSyncExternalStore(subscribeLang, getLang, getLang);
}

export function t(key: string, lang?: Lang): string {
    const l = lang || currentLang;
    return dictionaries[l][key] ?? dictionaries.en[key] ?? key;
}

// Explicit named exports for bundlers
export { dictionaries as _dict_debug };


