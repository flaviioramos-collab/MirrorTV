"use client";

import { useEffect, useState } from "react";

/**
 * Registra o service worker da PWA assim que o app carrega.
 * Só roda em produção / HTTPS — em dev falha silenciosamente.
 */
export function ServiceWorkerRegister() {
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production" && location.hostname === "localhost") {
      // Em dev local, o SW atrapalha o HMR — só registra em preview/produção.
      return;
    }
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(() => setRegistered(true))
        .catch(() => setRegistered(false));
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
