"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Radio, AlertCircle } from "lucide-react";
import type { MirrorStatus } from "@/lib/mirror/types";

interface PreviewPanelProps {
  stream: MediaStream | null;
  status: MirrorStatus;
  error?: string | null;
  protocolLabel: string;
  deviceLabel?: string;
}

const STATUS_MAP: Record<
  MirrorStatus,
  { label: string; tone: "idle" | "active" | "warn" | "err" }
> = {
  idle: { label: "Aguardando", tone: "idle" },
  requesting: { label: "Solicitando tela", tone: "warn" },
  ready: { label: "Tela capturada", tone: "active" },
  connecting: { label: "Conectando à TV", tone: "warn" },
  streaming: { label: "Transmitindo", tone: "active" },
  paused: { label: "Pausado", tone: "warn" },
  error: { label: "Erro", tone: "err" },
};

const TONE_CLASS: Record<string, string> = {
  idle: "bg-white/5 text-foreground/60 border-white/10",
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  warn: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  err: "bg-red-500/15 text-red-300 border-red-400/30",
};

export function PreviewPanel({
  stream,
  status,
  error,
  protocolLabel,
  deviceLabel,
}: PreviewPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (stream && v.srcObject !== stream) {
      v.srcObject = stream;
      v.play().catch(() => undefined);
    } else if (!stream && v.srcObject) {
      v.srcObject = null;
    }
  }, [stream]);

  const st = STATUS_MAP[status];

  return (
    <Card className="relative overflow-hidden glass border-white/10 rounded-3xl p-0">
      <div className="aspect-video w-full bg-black/40 relative flex items-center justify-center">
        <video
          ref={videoRef}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-contain"
        />
        {!stream && (
          <div className="text-center px-6">
            <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/40 to-fuchsia-500/40 flex items-center justify-center border border-white/10">
              {status === "requesting" || status === "connecting" ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : status === "error" ? (
                <AlertCircle className="h-6 w-6 text-red-300" />
              ) : (
                <Radio className="h-6 w-6 text-indigo-200" />
              )}
            </div>
            <p className="text-sm text-foreground/70">
              {error
                ? error
                : status === "idle"
                ? "Toque em “Iniciar captura” para espelhar sua tela"
                : "Preparando transmissão…"}
            </p>
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
          <Badge
            className={`border ${TONE_CLASS[st.tone]} backdrop-blur-md`}
            variant="outline"
          >
            {st.tone === "active" && (
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-400 pulse-dot text-emerald-400" />
            )}
            {st.label}
          </Badge>
          <Badge
            className="border border-white/10 bg-black/40 text-foreground/80 backdrop-blur-md"
            variant="outline"
          >
            {protocolLabel}
            {deviceLabel ? ` · ${deviceLabel}` : ""}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
