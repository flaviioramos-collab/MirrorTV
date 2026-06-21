"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MirrorStatus, QualityPreset } from "@/lib/mirror/types";

interface UseScreenCaptureOptions {
  onEnded?: () => void;
}

interface UseScreenCaptureReturn {
  status: MirrorStatus;
  stream: MediaStream | null;
  error: string | null;
  start: (
    preset: QualityPreset,
    opts?: { audio: boolean }
  ) => Promise<MediaStream | null>;
  stop: () => void;
  updateTrackConstraints: (preset: QualityPreset) => Promise<void>;
}

/**
 * Wrapper robusto em torno de navigator.mediaDevices.getDisplayMedia.
 * - Aplica constraints de resolução/fps baseadas no preset.
 * - Permite trocar constraints em tempo real via applyConstraints.
 * - Cancela stream corretamente quando o usuário encerra pelo botão nativo do browser.
 */
export function useScreenCapture(
  options: UseScreenCaptureOptions = {}
): UseScreenCaptureReturn {
  const [status, setStatus] = useState<MirrorStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onEndedRef = useRef(options.onEnded);
  useEffect(() => {
    onEndedRef.current = options.onEnded;
  }, [options.onEnded]);

  const cleanup = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* noop */
        }
      });
    }
    streamRef.current = null;
    setStream(null);
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setStatus("idle");
    setError(null);
  }, [cleanup]);

  const start = useCallback(
    async (
      preset: QualityPreset,
      opts: { audio: boolean } = { audio: true }
    ): Promise<MediaStream | null> => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
        setError(
          "Este navegador não suporta captura de tela. Use Chrome ou Edge no Android."
        );
        setStatus("error");
        return null;
      }
      setStatus("requesting");
      setError(null);
      try {
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: preset.width },
          height: { ideal: preset.height },
          frameRate: { ideal: preset.frameRate },
        };
        const audioConstraints: MediaTrackConstraints | boolean = opts.audio
          ? {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }
          : false;

        const newStream = await navigator.mediaDevices.getDisplayMedia({
          video: videoConstraints,
          audio: audioConstraints as MediaTrackConstraints,
          // @ts-expect-error - surfaceSwitching é estável no Chrome 110+
          surfaceSwitching: "include",
          // @ts-expect-error - monitorTypeSurfaces é estável no Chrome 110+
          monitorTypeSurfaces: "include",
          selfBrowserSurface: "exclude",
        });

        // Cleanup anterior
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        streamRef.current = newStream;
        setStream(newStream);
        setStatus("ready");

        // Detecta fim da captura pelo usuário (botão "Parar compartilhamento")
        newStream.getVideoTracks().forEach((track) => {
          track.addEventListener("ended", () => {
            cleanup();
            setStatus("idle");
            onEndedRef.current?.();
          });
        });

        return newStream;
      } catch (err: unknown) {
        const e = err as DOMException;
        if (e?.name === "NotAllowedError") {
          setError("Permissão de captura de tela negada. Autorize o acesso para espelhar.");
        } else if (e?.name === "NotFoundError") {
          setError("Nenhuma fonte de tela disponível para captura.");
        } else {
          setError(e?.message || "Não foi possível iniciar a captura de tela.");
        }
        setStatus("error");
        return null;
      }
    },
    [cleanup]
  );

  const updateTrackConstraints = useCallback(
    async (preset: QualityPreset) => {
      const s = streamRef.current;
      if (!s) return;
      const track = s.getVideoTracks()[0];
      if (!track) return;
      try {
        await track.applyConstraints({
          width: { ideal: preset.width },
          height: { ideal: preset.height },
          frameRate: { ideal: preset.frameRate },
        });
      } catch (e) {
        console.warn("applyConstraints falhou", e);
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    stream,
    error,
    start,
    stop,
    updateTrackConstraints,
  };
}
