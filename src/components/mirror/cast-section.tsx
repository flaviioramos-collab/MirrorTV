"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCast } from "@/lib/mirror/use-cast";
import {
  Cast,
  CircleCheck,
  Loader2,
  Play,
  Square,
  Tv,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { QualityControls } from "@/components/mirror/quality-controls";
import type { QualityPreset } from "@/lib/mirror/types";

interface CastSectionProps {
  preset: QualityPreset;
  onPresetChange: (p: QualityPreset) => void;
  withAudio: boolean;
  onWithAudioChange: (v: boolean) => void;
  stream: MediaStream | null;
  onStartCapture: () => Promise<MediaStream | null>;
  onStopCapture: () => void;
}

export function CastSection(props: CastSectionProps) {
  const cast = useCast();
  const [streamUrl, setStreamUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSelectTv = async () => {
    setBusy(true);
    try {
      const ok = await cast.requestSession();
      if (ok) toast.success("Conectado à TV. Selecione a fonte de vídeo abaixo.");
      else toast.info("Nenhum dispositivo selecionado.");
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async () => {
    setBusy(true);
    try {
      // 1. Captura a tela
      const s = await props.onStartCapture();
      if (!s) return;
      // 2. Cast — o Cast Receiver padrão precisa de uma URL pública de mídia.
      // Em sandbox, instruímos o usuário a publicar um stream HLS ao vivo e
      // colar a URL. O fluxo completo de WebRTC→HLS transcoding está fora do
      // escopo desta PWA.
      if (!streamUrl) {
        toast.info(
          "Tela capturada! Para enviar à TV via Cast, cole a URL pública do seu stream HLS/MP4 (ex.: de um servidor ffmpeg)."
        );
        return;
      }
      const loaded = await cast.loadUrl(streamUrl);
      if (loaded) toast.success("Transmitindo para a TV via Chromecast.");
      else toast.error("Falha ao carregar mídia na TV.");
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    await cast.stop();
    props.onStopCapture();
    toast.info("Transmissão encerrada.");
  };

  return (
    <div className="space-y-5">
      <Card className="glass border-white/10 rounded-3xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Cast className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Chromecast / Google TV</h3>
              <p className="text-sm text-foreground/65">
                Funciona com Android TV, Google TV, Chromecast e TVs Samsung,
                LG, Sony, TCL, Philips (modelos 2018+) que suportam Cast.
              </p>
            </div>
          </div>

          {!cast.available && (
            <div className="flex items-start gap-2 rounded-2xl bg-amber-500/10 border border-amber-400/20 p-3 text-xs text-amber-200">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                SDK do Google Cast indisponível neste ambiente. Funcionará em
                produção com HTTPS e domínio válido.
              </span>
            </div>
          )}

          <Button
            onClick={handleSelectTv}
            disabled={busy || !cast.available}
            className="w-full h-12 rounded-xl btn-neon text-white font-semibold"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : cast.currentSession ? (
              <CircleCheck className="h-4 w-4 mr-2" />
            ) : (
              <Tv className="h-4 w-4 mr-2" />
            )}
            {cast.currentSession ? "Trocar de TV" : "Selecionar TV"}
          </Button>

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
              O Cast Receiver precisa de uma URL acessível pela TV. Para
              espelhar a tela do navegador, publique um stream ao vivo (ex.:
              ffmpeg + nginx-rtmp) e cole o endereço aqui.
            </p>
          </div>
        </CardContent>
      </Card>

      <QualityControls
        preset={props.preset}
        onPresetChange={props.onPresetChange}
        withAudio={props.withAudio}
        onWithAudioChange={props.onWithAudioChange}
        disabled={!cast.currentSession}
      />

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleStart}
          disabled={busy || !cast.currentSession}
          className="h-12 rounded-xl btn-neon text-white font-semibold"
        >
          <Play className="h-4 w-4 mr-2" />
          Iniciar espelho
        </Button>
        <Button
          onClick={handleStop}
          disabled={busy || !cast.currentSession}
          variant="outline"
          className="h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
        >
          <Square className="h-4 w-4 mr-2" />
          Parar
        </Button>
      </div>
    </div>
  );
}
