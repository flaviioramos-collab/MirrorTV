"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Tipos mínimos do Cast SDK — não importamos do pacote pois o SDK é
// carregado dinamicamente via script tag.

interface CastSession {
  getSessionObj: () => unknown;
  addMediaListener: (cb: (media: unknown) => void) => void;
  addUpdateListener: (cb: (isAlive: boolean) => void) => void;
  loadMedia: (request: unknown) => Promise<void>;
  stop: (request?: unknown) => Promise<void>;
  getMediaSession?: () => unknown;
  endSession: (stopCasting: boolean) => void;
}

interface CastContext {
  setOptions: (opts: unknown) => void;
  getCurrentSession: () => CastSession | null;
  requestSession: () => Promise<number>;
  addEventListener: (event: string, cb: (session: CastSession) => void) => void;
  CAST_CONFIG_REASON: unknown;
}

declare global {
  interface Window {
    chrome?: {
      cast?: {
        VERSION?: number;
        isAvailable?: boolean;
        AutoJoinPolicy?: { ORIGIN_SCOPED: unknown; TAB_AND_ORIGIN_SCOPED: unknown; PAGE_SCOPED: unknown };
        DefaultActionPolicy?: { CREATE_SESSION: unknown; CAST_THIS_TAB: unknown };
        SessionRequest?: new (appId: string) => unknown;
        ApiConfig?: new (
          sessionRequest: unknown,
          onSession: unknown,
          onReceive: unknown,
          autoJoinPolicy?: unknown,
          defaultActionPolicy?: unknown
        ) => unknown;
        media?: {
          LoadRequest?: new (info: unknown) => unknown;
          MediaInfo?: new (contentId: string, contentType: string) => unknown;
          GenericMediaMetadata?: new () => unknown;
        };
        LogLevel?: { DEBUG: unknown; INFO: unknown; WARNING: unknown; ERROR: unknown };
        Logger?: new () => { setLevel: (l: unknown) => void };
      };
      cast?: {
        framework?: {
          CastContext: {
            getInstance: () => CastContext;
            CastContextEventType?: { SESSION_STATE_CHANGED: string; CAST_STATE_CHANGED: string };
            CastState?: { NO_DEVICES_AVAILABLE: string; NOT_CONNECTED: string; CONNECTING: string; CONNECTED: string };
            SessionState?: { SESSION_STARTED: string; SESSION_RESUMED: string; SESSION_ENDED: string; NO_SESSION: string };
          };
        };
      };
    };
    __castGCallback?: () => void;
  }
}

const DEFAULT_RECEIVER_APP_ID = "CC1AD845"; // Default Media Receiver do Google

let castSdkPromise: Promise<void> | null = null;

function loadCastSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.chrome?.cast?.isAvailable) return Promise.resolve();
  if (castSdkPromise) return castSdkPromise;

  castSdkPromise = new Promise<void>((resolve) => {
    window.__castGCallback = function () {
      resolve();
    };
    const s = document.createElement("script");
    s.src =
      "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
    s.async = true;
    s.onerror = () => {
      // Sem rede para o CDN do Google — não impede o resto do app.
      resolve();
    };
    document.head.appendChild(s);
  });
  return castSdkPromise;
}

export interface CastDevice {
  id: string;
  name: string;
}

export interface UseCastReturn {
  available: boolean;
  initialized: boolean;
  currentSession: CastSession | null;
  devices: CastDevice[];
  /** Abre o seletor nativo do Cast (overlay do browser) */
  requestSession: () => Promise<boolean>;
  /** Envia um stream de tela (MediaStream) para a TV via Default Media Receiver.
   *  Como o receiver padrão não aceita WebRTC, este método usa uma URL HLS
   *  fornecida (gerada pelo mini-service). Em ambiente de sandbox, o usuário
   *  deve fornecer uma URL pública. */
  loadUrl: (url: string, mimeType?: string) => Promise<boolean>;
  pause: () => Promise<void>;
  play: () => Promise<void>;
  stop: () => Promise<void>;
  endSession: () => void;
}

export function useCast(): UseCastReturn {
  const [available, setAvailable] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [currentSession, setCurrentSession] = useState<CastSession | null>(null);
  const sessionRef = useRef<CastSession | null>(null);

  useEffect(() => {
    let mounted = true;
    loadCastSdk().then(() => {
      if (!mounted) return;
      const ctx = window.chrome?.cast?.framework?.CastContext?.getInstance?.();
      if (!ctx) return;
      ctx.setOptions({
        receiverApplicationId: DEFAULT_RECEIVER_APP_ID,
        autoJoinPolicy: window.chrome!.cast!.AutoJoinPolicy!.ORIGIN_SCOPED,
      });
      ctx.addEventListener("sessionstatechanged", (session: CastSession) => {
        sessionRef.current = session;
        setCurrentSession(session);
      });
      setInitialized(true);
      setAvailable(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const requestSession = useCallback(async (): Promise<boolean> => {
    const ctx = window.chrome?.cast?.framework?.CastContext?.getInstance?.();
    if (!ctx) return false;
    try {
      await ctx.requestSession();
      const s = ctx.getCurrentSession();
      sessionRef.current = s;
      setCurrentSession(s);
      return !!s;
    } catch (e) {
      console.warn("requestSession falhou", e);
      return false;
    }
  }, []);

  const loadUrl = useCallback(
    async (url: string, mimeType = "video/mp4"): Promise<boolean> => {
      const ctx = window.chrome?.cast?.framework?.CastContext?.getInstance?.();
      const s = ctx?.getCurrentSession?.();
      if (!s) return false;
      try {
        const c = window.chrome!.cast!;
        const mediaInfo = new c.media!.MediaInfo!(url, mimeType);
        const metadata = new c.media!.GenericMediaMetadata!();
        // @ts-expect-error runtime field
        metadata.title = "MirrorTV — Espelho de Tela";
        // @ts-expect-error runtime field
        mediaInfo.metadata = metadata;
        // @ts-expect-error runtime field
        mediaInfo.streamType = "LIVE";
        const request = new c.media!.LoadRequest!(mediaInfo);
        await s.loadMedia(request);
        return true;
      } catch (e) {
        console.warn("loadMedia falhou", e);
        return false;
      }
    },
    []
  );

  const pause = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    try {
      const media = (s as CastSession & { getMediaSession?: () => { pause?: () => Promise<void> } }).getMediaSession?.();
      await media?.pause?.();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const play = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    try {
      const media = (s as CastSession & { getMediaSession?: () => { play?: () => Promise<void> } }).getMediaSession?.();
      await media?.play?.();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const stop = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    try {
      await s.stop();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const endSession = useCallback(() => {
    const ctx = window.chrome?.cast?.framework?.CastContext?.getInstance?.();
    const s = ctx?.getCurrentSession?.();
    if (s) {
      try {
        s.endSession(true);
      } catch {
        /* noop */
      }
    }
    sessionRef.current = null;
    setCurrentSession(null);
  }, []);

  return {
    available,
    initialized,
    currentSession,
    devices: [],
    requestSession,
    loadUrl,
    pause,
    play,
    stop,
    endSession,
  };
}
