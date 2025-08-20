import "./../styles/globals.css";
import type { ReactNode } from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getLang } from "@/lib/i18n";
import { LocaleHydrator } from "./LocaleHydrator";
import GlobalHeader from "./GlobalHeader";
import { Footer } from "@/components";
import { SettingsProvider } from "@/lib/settings";

export const metadata: Metadata = {
  title: "bitsbarter - Local Classifieds in Bitcoin",
  description: "Local classifieds in sats or BTC. Built-in chat and Lightning escrow for safer meetups.",
  keywords: ["bitcoin", "classifieds", "local", "escrow", "lightning"],
  icons: {
    icon: "/Bitsbarterlogo.svg",
    shortcut: "/Bitsbarterlogo.svg",
    apple: "/Bitsbarterlogo.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const lang = getLang();
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="antialiased">
        <SettingsProvider>
          <LocaleHydrator />
          {/* Global header (Nav is sticky itself) */}
          <Suspense fallback={null}>
            <GlobalHeader />
          </Suspense>
          {children}
        </SettingsProvider>
        {/* Global footer */}
        <Footer />
      </body>
    </html>
  );
}
