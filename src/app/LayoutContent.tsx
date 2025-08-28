"use client";

import { usePathname } from "next/navigation";
import GlobalHeader from "./GlobalHeader";
import Footer from "@/components/Footer";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide footer on messages page
  const shouldShowFooter = pathname !== '/messages';
  
  return (
    <>
      <GlobalHeader />
      {children}
      {shouldShowFooter && <Footer />}
    </>
  );
}
