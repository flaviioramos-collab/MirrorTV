"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useDlna } from "@/lib/mirror/use-dlna";
import {
  Loader2,
  Play,
  Square,
  RefreshCw,
  Tv,
  Wifi,
  AlertCircle,
  CheckCircle2,
  Pause,
} from "lucide-react";
import { toast } from "sonner";
import { QualityControls } from "@/components/mirror/quality-controls";
import type { QualityPreset, DiscoveredDevice } from "@/lib/mirror/types";

interface DlnaSectionProps {
  preset: QualityPreset;
  onPresetChange: (p: QualityPreset) => void;
  withAudio: boolean;
  onWithAudioChange: (v: boolean) => void;
  stream: MediaStream | null;
  onStartCapture: () => Promise<MediaStream | null>;
  onStopCapture: () => void;
}

export function DlnaSection(props: DlnaSectionProps) {
  const dlna = useDlna();
  const [selected, setSelected] = useState<DiscoveredDevice | null>(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const handleStart = async () => {
    if (!selected) {
      toast.error("Selecione uma TV DLNA primeiro.");
      return;
    }
    if (!streamUrl) {
      toast.error("Informe a URL do stream.");
      return;
    }
    setBusy(true);
    try {
      const s = await props.onStartCapture();
      if (!s) return;
      const ok = await dlna.castUrl(selected.id, streamUrl);
      if (ok) toast.success(`Transmitindo para ${selected.name} via DLNA.`);
      else toast.error("Falha ao enviar comando para a TV.");
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    if (!selected) {
      props.onStopCapture();
      return;
    }
    await dlna.sendCommand(selected.id, "Stop");
    props.onStopCapture();
    toast.info("Transmissão encerrada.");
  };

  return (
    <div className="space-y-5">
      <Card className="glass border-white/10 rounded-3xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
              <Wifi className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">DLNA / UPnP</h3>
              <p className="text-sm text-foreground/65">
                Funciona com TVs mais antigas e receptores de rede. A descoberta
                roda no servidor Node (porta 3004) via SSDP.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-foreground/60">
              TVs encontradas
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dlna.scan()}
              disabled={dlna.scanning}
              className="h-7 text-xs text-foreground/70 hover:text-foreground"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1.5 ${dlna.scanning ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
          </div>

          {dlna.scanning && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl bg-white/5" />
              ))}
            </div>
          )}

          {!dlna.scanning && dlna.devices.length === 0 && !dlna.error && (
            <div className="text-center py-6 text-sm text-foreground/55">
              <Tv className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhuma TV DLNA encontrada. Verifique se celular e TV estão na
              mesma rede Wi-Fi.
            </div>
          )}

          {!dlna.scanning && dlna.devices.length > 0 && (
            <ScrollArea className="max-h-72 rounded-2xl border border-white/10 bg-black/20">
              <div className="p-2 space-y-1.5">
                {dlna.devices.map((d) => {
                  const isSel = selected?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelected(d)}
                      className={`w-full text-left rounded-2xl px-3 py-3 flex items-center gap-3 transition-all border ${
                        isSel
                          ? "bg-indigo-500/15 border-indigo-400/40"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                          isSel
                            ? "bg-indigo-500 text-white"
                            : "bg-white/10 text-foreground/70"
                        }`}
                      >
                        <Tv className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.name}</p>
                        <p className="text-[11px] text-foreground/50 truncate">
                          {d.model || "Dispositivo DLNA"}
                        </p>
                      </div>
                      {isSel && <CheckCircle2 className="h-4 w-4 text-indigo-300" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {dlna.error && (
            <div className="flex items-start gap-2 rounded-2xl bg-red-500/10 border border-red-400/20 p-3 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{dlna.error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-foreground/60">
              URL do stream (HLS ou MP4)
            </Label>
            <Input
              placeholder="https://exemplo.com/stream.m3u8"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              className="bg-white/5 border-white/10"
            />
            <p className="text-[11px] text-foreground/55">
              TVs DLNA só conseguem reproduzir URLs HTTP de vídeo. Para
              espelhar a tela do navegador, publique um stream ao vivo (ex.:
              ffmpeg + nginx) e cole o endereço aqui.
            </p>
          </div>
        </CardContent>
      </Card>

      <QualityControls
        preset={props.preset}
        onPresetChange={props.onPresetChange}
        withAudio={props.withAudio}
        onWithAudioChange={props.onWithAudioChange}
        disabled={!selected}
      />

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleStart}
          disabled={busy || !selected}
          className="h-12 rounded-xl btn-neon text-white font-semibold"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Iniciar espelho
        </Button>
        <Button
          onClick={handleStop}
          disabled={busy || !selected}
          variant="outline"
          className="h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
        >
          <Square className="h-4 w-4 mr-2" />
          Parar
        </Button>
      </div>

      {selected && (
        <div className="flex gap-2">
          <Button
            onClick={() => dlna.sendCommand(selected.id, "Pause")}
            variant="ghost"
            size="sm"
            className="flex-1 h-10 rounded-xl border border-white/10 bg-white/5"
          >
            <Pause className="h-3.5 w-3.5 mr-1.5" /> Pausar
          </Button>
          <Button
            onClick={() => dlna.sendCommand(selected.id, "Play")}
            variant="ghost"
            size="sm"
            className="flex-1 h-10 rounded-xl border border-white/10 bg-white/5"
          >
            <Play className="h-3.5 w-3.5 mr-1.5" /> Continuar
          </Button>
        </div>
      )}
    </div>
  );
}
