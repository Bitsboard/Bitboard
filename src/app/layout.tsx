import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import GlobalHeader from "./GlobalHeader";
import { LocaleHydrator } from "./LocaleHydrator";
import { ThemeProvider } from "@/components/ThemeProvider";

import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "bitsbarter - Bitcoin-native Marketplace",
  description: "The Bitcoin-native marketplace for buying, selling, and trading goods and services.",
  keywords: ["Bitcoin", "marketplace", "trading", "buy", "sell", "crypto"],
  authors: [{ name: "bitsbarter" }],
  creator: "bitsbarter",
  publisher: "bitsbarter",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://bitsbarter.com"),
  openGraph: {
    title: "bitsbarter - Bitcoin-native Marketplace",
    description: "The Bitcoin-native marketplace for buying, selling, and trading goods and services.",
    url: "https://bitsbarter.com",
    siteName: "bitsbarter",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "bitsbarter - Bitcoin-native Marketplace",
    description: "The Bitcoin-native marketplace for buying, selling, and trading goods and services.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f97316" />
        <link rel="icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Initialize theme immediately to prevent flash
                  var theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.className = theme;
                  document.body.className = theme;
                  document.documentElement.setAttribute('data-theme', theme);
                  document.body.setAttribute('data-theme', theme);
                  
                  // Also set classList for Tailwind compatibility
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                  document.body.classList.remove('light', 'dark');
                  document.body.classList.add(theme);
                } catch (e) {
                  // Fallback to dark mode
                  document.documentElement.className = 'dark';
                  document.body.className = 'dark';
                  document.documentElement.classList.add('dark');
                  document.body.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <LocaleHydrator>
          <ThemeProvider>
            <GlobalHeader />
            {children}
            <Footer />
          </ThemeProvider>
        </LocaleHydrator>
      </body>
    </html>
  );
}
