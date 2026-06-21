"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DiscoveredDevice } from "@/lib/mirror/types";

const DLNA_PORT = 3004;
const DLNA_PATH = (sub: string) => `/api/dlna/${sub}?XTransformPort=${DLNA_PORT}`;

interface UseDlnaReturn {
  scanning: boolean;
  devices: DiscoveredDevice[];
  error: string | null;
  scan: () => Promise<void>;
  /** Envia comando SOAP SetAVTransportURI para a TV DLNA. */
  castUrl: (deviceId: string, url: string, mimeType?: string) => Promise<boolean>;
  /** Comando de play/pause/stop via SOAP (instance 0). */
  sendCommand: (
    deviceId: string,
    cmd: "Play" | "Pause" | "Stop"
  ) => Promise<boolean>;
}

/**
 * Descoberta e controle DLNA via mini-service (porta 3004).
 * O navegador não fala SSDP nativamente, então o mini-service Node faz
 * a descoberta e o repasse de comandos SOAP.
 */
export function useDlna(): UseDlnaReturn {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scan = useCallback(async () => {
    setError(null);
    setScanning(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch(DLNA_PATH("scan"), {
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { devices: DiscoveredDevice[] };
      setDevices(data.devices || []);
    } catch (e) {
      const msg = (e as Error).message;
      setError(`Falha ao procurar TVs DLNA: ${msg}`);
    } finally {
      setScanning(false);
    }
  }, []);

  const castUrl = useCallback(
    async (deviceId: string, url: string, mimeType = "video/mp4"): Promise<boolean> => {
      try {
        const res = await fetch(DLNA_PATH("cast"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, url, mimeType }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { ok: boolean };
        return !!data.ok;
      } catch {
        return false;
      }
    },
    []
  );

  const sendCommand = useCallback(
    async (
      deviceId: string,
      cmd: "Play" | "Pause" | "Stop"
    ): Promise<boolean> => {
      try {
        const res = await fetch(DLNA_PATH("control"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, cmd }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { ok: boolean };
        return !!data.ok;
      } catch {
        return false;
      }
    },
    []
  );

  // Varredura automática ao montar
  useEffect(() => {
    scan();
    return () => abortRef.current?.abort();
  }, [scan]);

  return {
    scanning,
    devices,
    error,
    scan,
    castUrl,
    sendCommand,
  };
}
