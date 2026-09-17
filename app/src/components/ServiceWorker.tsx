"use client";

import { useEffect } from "react";

/** Registers the offline shell. Production only — it just gets in the way in dev. */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline support is a nice-to-have */
    });
  }, []);
  return null;
}
