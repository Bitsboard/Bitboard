"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n-client";
import { useTheme } from "@/lib/settings";

export default function TermsPage() {
    const { theme } = useTheme();
    const dark = theme === 'dark';
    const lang = useLang();
    const homeHref = `/${lang}`;

    const content: Record<string, any> = {
        en: {
            title: "Terms & Conditions",
            sections: [
                { h: "1. General Terms", p: "By using bitsbarter, you agree to keep all correspondence in-app for safety. Off-app contact may limit our ability to help in disputes." },
                { h: "2. User Responsibilities", p: "Listings must comply with local laws. You are responsible for ensuring legality and authenticity of items and services." },
                { h: "3. Escrow & Payments", p: "Escrow is provided via Lightning hold invoices. Funds are released only when both parties confirm, or a mediator decides in good faith based on in-app evidence." },
                { h: "4. Prohibited Items", p: "Prohibited items include: weapons, illicit drugs, stolen goods, counterfeit items, recalled/unsafe goods, and anything illegal in your jurisdiction." },
                { h: "5. Platform Role", p: "We are a venue: transactions are between users. bitsbarter is not a bank and does not custody fiat. Bitcoin price estimates are informational only." },
                { h: "6. Enforcement", p: "Violations of these terms can result in deletion of content and/or account suspension." },
                {
                    h: "7. Safety Guidelines", list: [
                        "Meet in a very public place: malls, cafés, or police e-commerce zones.",
                        "Bring a friend or tell someone your meeting place and time.",
                        "Keep all correspondence in-app; off-app contact is against our guidelines.",
                        "Inspect items in person; test devices and verify serial numbers.",
                        "Prefer Lightning escrow over cash; confirm release only when satisfied.",
                        "Trust your instincts — if something feels off, walk away and report the listing.",
                    ]
                },
                { h: "8. Contact", p: "For questions about these terms, please contact us through the app. Keep all correspondence in-app for safety and record-keeping." },
            ]
        },
        fr: {
            title: "Conditions générales",
            sections: [
                { h: "1. Conditions générales", p: "En utilisant bitsbarter, vous acceptez de conserver toute correspondance dans l’application pour votre sécurité. Le contact hors application peut limiter notre capacité à vous aider en cas de litige." },
                { h: "2. Responsabilités de l’utilisateur", p: "Les annonces doivent respecter les lois locales. Vous êtes responsable de la légalité et de l’authenticité des biens et services proposés." },
                { h: "3. Séquestre & paiements", p: "Le séquestre est assuré via des factures Lightning en attente. Les fonds sont libérés lorsque les deux parties confirment, ou lorsqu’un médiateur décide de bonne foi sur la base des preuves in‑app." },
                { h: "4. Objets interdits", p: "Objets interdits : armes, drogues illicites, biens volés, contrefaçons, produits rappelés/dangereux, et tout élément illégal dans votre juridiction." },
                { h: "5. Rôle de la plateforme", p: "Nous fournissons un lieu de mise en relation : les transactions ont lieu entre utilisateurs. bitsbarter n’est pas une banque et ne conserve pas de fiat. Les estimations de prix du Bitcoin sont uniquement informatives." },
                { h: "6. Application", p: "Le non‑respect de ces conditions peut entraîner la suppression de contenu et/ou la suspension du compte." },
                {
                    h: "7. Conseils de sécurité", list: [
                        "Rencontrez‑vous dans un lieu très public : centres commerciaux, cafés ou zones e‑commerce de la police.",
                        "Venez accompagné ou informez un proche du lieu et de l’heure du rendez‑vous.",
                        "Conservez toute la correspondance dans l’application ; le contact hors application est contraire à nos directives.",
                        "Examinez les articles en personne ; testez les appareils et vérifiez les numéros de série.",
                        "Privilégiez le séquestre Lightning plutôt que l’espèce ; confirmez la libération uniquement lorsque vous êtes satisfait.",
                        "Fiez‑vous à votre instinct — si quelque chose vous paraît suspect, partez et signalez l’annonce.",
                    ]
                },
                { h: "8. Contact", p: "Pour toute question concernant ces conditions, contactez‑nous via l’application. Conservez la correspondance dans l’application pour votre sécurité et la traçabilité." },
            ]
        },
        es: {
            title: "Términos y Condiciones",
            sections: [
                { h: "1. Términos generales", p: "Al usar bitsbarter, aceptas mantener toda la correspondencia dentro de la aplicación por seguridad. El contacto fuera de la app puede limitar nuestra capacidad para ayudar en disputas." },
                { h: "2. Responsabilidades del usuario", p: "Los anuncios deben cumplir con las leyes locales. Eres responsable de la legalidad y autenticidad de los artículos y servicios." },
                { h: "3. Depósito en garantía y pagos", p: "El escrow se realiza mediante facturas Lightning en espera. Los fondos se liberan cuando ambas partes confirman, o cuando un mediador decide de buena fe basándose en la evidencia de la app." },
                { h: "4. Artículos prohibidos", p: "Artículos prohibidos: armas, drogas ilícitas, bienes robados, productos falsificados, artículos retirados/inseguros y cualquier cosa ilegal en tu jurisdicción." },
                { h: "5. Rol de la plataforma", p: "Somos un punto de encuentro: las transacciones son entre usuarios. bitsbarter no es un banco y no custodia fiat. Las estimaciones del precio de Bitcoin son solo informativas." },
                { h: "6. Aplicación", p: "Las infracciones de estos términos pueden dar lugar a la eliminación de contenido y/o la suspensión de la cuenta." },
                {
                    h: "7. Directrices de seguridad", list: [
                        "Reúnete en un lugar muy público: centros comerciales, cafés o zonas e‑commerce de la policía.",
                        "Ve con un acompañante o avisa a alguien del lugar y hora de tu cita.",
                        "Mantén toda la correspondencia en la app; el contacto fuera de la app va en contra de nuestras directrices.",
                        "Inspecciona los artículos en persona; prueba los dispositivos y verifica números de serie.",
                        "Prefiere el escrow Lightning en lugar de efectivo; confirma la liberación solo cuando estés satisfecho.",
                        "Confía en tu instinto: si algo no te cuadra, aléjate y reporta el anuncio.",
                    ]
                },
                { h: "8. Contacto", p: "Para preguntas sobre estos términos, contáctanos desde la app. Mantén la correspondencia en la app por seguridad y registro." },
            ]
        },
        de: {
            title: "Allgemeine Geschäftsbedingungen",
            sections: [
                { h: "1. Allgemeine Bedingungen", p: "Durch die Nutzung von bitsbarter verpflichten Sie sich, die gesamte Korrespondenz aus Sicherheitsgründen in der App zu führen. Kontakt außerhalb der App kann unsere Unterstützung bei Streitfällen einschränken." },
                { h: "2. Pflichten der Nutzer", p: "Anzeigen müssen den lokalen Gesetzen entsprechen. Sie sind für die Rechtmäßigkeit und Echtheit der angebotenen Waren und Dienstleistungen verantwortlich." },
                { h: "3. Treuhand & Zahlungen", p: "Die Treuhand erfolgt über Lightning‑Hold‑Rechnungen. Gelder werden freigegeben, wenn beide Parteien bestätigen, oder wenn ein Vermittler nach Treu und Glauben auf Grundlage von In‑App‑Belegen entscheidet." },
                { h: "4. Verbotene Artikel", p: "Verbotene Artikel sind u. a.: Waffen, illegale Drogen, Diebesgut, Fälschungen, zurückgerufene/unsichere Produkte und alles, was in Ihrer Jurisdiktion illegal ist." },
                { h: "5. Rolle der Plattform", p: "Wir sind ein Marktplatz: Transaktionen erfolgen zwischen Nutzern. bitsbarter ist keine Bank und verwahrt kein Fiat. Bitcoin‑Preisschätzungen dienen nur zur Information." },
                { h: "6. Durchsetzung", p: "Verstöße gegen diese Bedingungen können zur Löschung von Inhalten und/oder zur Sperrung des Kontos führen." },
                {
                    h: "7. Sicherheitshinweise", list: [
                        "Treffen Sie sich an sehr öffentlichen Orten: Einkaufszentren, Cafés oder behördliche E‑Commerce‑Zonen.",
                        "Kommen Sie mit Begleitung oder informieren Sie jemanden über Ort und Zeit.",
                        "Führen Sie die gesamte Korrespondenz in der App; Kontakt außerhalb der App verstößt gegen unsere Richtlinien.",
                        "Prüfen Sie Artikel vor Ort; testen Sie Geräte und verifizieren Sie Seriennummern.",
                        "Bevorzugen Sie Lightning‑Treuhand statt Bargeld; bestätigen Sie die Freigabe erst bei Zufriedenheit.",
                        "Vertrauen Sie Ihrem Gefühl — wirkt etwas unseriös, brechen Sie ab und melden Sie die Anzeige.",
                    ]
                },
                { h: "8. Kontakt", p: "Bei Fragen zu diesen Bedingungen kontaktieren Sie uns bitte über die App. Führen Sie die Korrespondenz zu Ihrer Sicherheit und Nachvollziehbarkeit in der App." },
            ]
        }
    };
    const C = content[lang] || content.en;

    return (
        <div className={cn("min-h-screen", dark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900")}>
            {/* Header via layout */}

            <main className="mx-auto max-w-4xl px-4 py-12">
                <div className="prose prose-lg max-w-none">
                    <h1 className="text-4xl font-black mb-8">{C.title}</h1>

                    <div className={cn("rounded-2xl border p-8", dark ? "border-neutral-800 bg-neutral-900" : "border-neutral-300 bg-white")}>
                        <div className="space-y-6 text-base">
                            {C.sections.map((s: any, i: number) => (
                                <section key={i}>
                                    <h2 className="text-2xl font-bold mb-4">{s.h}</h2>
                                    {s.p && <p>{s.p}</p>}
                                    {s.list && (
                                        <ul className="list-disc pl-6 space-y-2">
                                            {s.list.map((li: string, idx: number) => (
                                                <li key={idx}>{li}</li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer via layout */}
        </div>
    );
}
