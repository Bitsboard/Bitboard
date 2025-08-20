"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n-client";

export default function PrivacyPage() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.classList.toggle('dark', saved === 'dark');
        setDark(saved === 'dark');
      } else {
        setDark(document.documentElement.classList.contains('dark'));
      }
    } catch { }
    const onTheme = (e: Event) => {
      const d = (e as CustomEvent).detail as 'dark' | 'light' | undefined;
      if (!d) return;
      try {
        const isDark = d === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        setDark(isDark);
      } catch { }
    };
    window.addEventListener('bb:theme', onTheme as EventListener);
    return () => window.removeEventListener('bb:theme', onTheme as EventListener);
  }, []);
  const lang = useLang();

  const content: Record<string, any> = {
    en: {
      title: 'Privacy Policy',
      sections: [
        { h: '1. Overview', p: 'We collect the minimum necessary information to operate the marketplace and keep users safe.' },
        {
          h: '2. Data we store', list: [
            'Authentication data: your Google sign-in identifier (for internal use), username you choose, and profile photo.',
            'Content: listings and messages you create.',
            'Technical: basic logs for reliability and security.',
          ]
        },
        {
          h: '3. How we use data', list: [
            'Operate features like chat, listings, and escrow.',
            'Moderation and fraud prevention.',
            'Legal compliance.',
          ]
        },
        { h: '4. Your choices', p: 'You can sign out anytime. For account/data requests, contact us in-app. Keep correspondence in-app for safety.' },
      ]
    },
    fr: {
      title: 'Politique de confidentialité',
      sections: [
        { h: '1. Aperçu', p: 'Nous recueillons le strict minimum nécessaire pour faire fonctionner la plateforme et assurer la sécurité des utilisateurs.' },
        {
          h: '2. Données que nous stockons', list: [
            "Données d’authentification : identifiant de connexion Google (usage interne), nom d’utilisateur choisi et photo de profil.",
            'Contenu : annonces et messages créés.',
            'Technique : journaux de base pour la fiabilité et la sécurité.',
          ]
        },
        {
          h: '3. Utilisation des données', list: [
            'Fonctionnement des fonctionnalités (messagerie, annonces, séquestre).',
            'Modération et prévention de la fraude.',
            'Conformité légale.',
          ]
        },
        { h: '4. Vos choix', p: "Vous pouvez vous déconnecter à tout moment. Pour toute demande liée au compte/aux données, contactez‑nous dans l’application. Conservez la correspondance dans l’application pour votre sécurité." },
      ]
    },
    es: {
      title: 'Política de privacidad',
      sections: [
        { h: '1. Resumen', p: 'Recopilamos la información mínima necesaria para operar el mercado y mantener la seguridad de los usuarios.' },
        {
          h: '2. Datos que almacenamos', list: [
            'Datos de autenticación: identificador de acceso con Google (uso interno), nombre de usuario elegido y foto de perfil.',
            'Contenido: anuncios y mensajes que creas.',
            'Técnicos: registros básicos para fiabilidad y seguridad.',
          ]
        },
        {
          h: '3. Cómo usamos los datos', list: [
            'Operar funciones como chat, anuncios y escrow.',
            'Moderación y prevención del fraude.',
            'Cumplimiento legal.',
          ]
        },
        { h: '4. Tus opciones', p: 'Puedes cerrar sesión en cualquier momento. Para solicitudes de cuenta/datos, contáctanos en la app. Mantén la correspondencia en la app por seguridad.' },
      ]
    },
    de: {
      title: 'Datenschutzerklärung',
      sections: [
        { h: '1. Überblick', p: 'Wir erheben nur die Daten, die zum Betrieb des Marktplatzes und zur Sicherheit der Nutzer erforderlich sind.' },
        {
          h: '2. Von uns gespeicherte Daten', list: [
            'Authentifizierungsdaten: Ihre Google‑Anmeldekennung (intern), gewählter Benutzername und Profilfoto.',
            'Inhalte: von Ihnen erstellte Anzeigen und Nachrichten.',
            'Technisch: Basis‑Logs für Zuverlässigkeit und Sicherheit.',
          ]
        },
        {
          h: '3. Nutzung der Daten', list: [
            'Betrieb von Funktionen wie Chat, Anzeigen und Treuhand.',
            'Moderation und Betrugsprävention.',
            'Gesetzliche Compliance.',
          ]
        },
        { h: '4. Ihre Wahlmöglichkeiten', p: 'Sie können sich jederzeit abmelden. Für Konto-/Datenanfragen kontaktieren Sie uns bitte in der App. Führen Sie die Korrespondenz zu Ihrer Sicherheit in der App.' },
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
                      {s.list.map((li: string, idx: number) => (<li key={idx}>{li}</li>))}
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


