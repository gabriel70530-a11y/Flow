"use client";

import { useEffect } from "react";

// Só em produção: no desenvolvimento, o cache atrapalharia ver as mudanças.
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
