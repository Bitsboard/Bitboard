"use client";

import { useEffect } from "react";

export default function PrefsHydrator() {
  useEffect(() => {
    try {
      const unit = localStorage.getItem('priceUnit');
      if (unit === 'sats' || unit === 'BTC') {
        window.dispatchEvent(new CustomEvent('bb:unit', { detail: unit }));
      }
    } catch {}
    try {
      const layout = localStorage.getItem('layoutPref');
      if (layout === 'grid' || layout === 'list') {
        window.dispatchEvent(new CustomEvent('bb:layout', { detail: layout }));
      }
    } catch {}
  }, []);
  return null;
}


