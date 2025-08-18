import "./../styles/globals.css";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getLang } from "@/lib/i18n";

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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
