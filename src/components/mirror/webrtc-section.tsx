"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useWebRtc } from "@/lib/mirror/use-webrtc";
import {
  Loader2,
  Play,
  Square,
  Link2,
  Copy,
  Radio,
  Users,
  LogOut,
  MonitorPlay,
} from "lucide-react";
import { toast } from "sonner";
import { QualityControls } from "@/components/mirror/quality-controls";
import type { QualityPreset } from "@/lib/mirror/types";

interface WebRtcSectionProps {
  preset: QualityPreset;
  onPresetChange: (p: QualityPreset) => void;
  withAudio: boolean;
  onWithAudioChange: (v: boolean) => void;
  stream: MediaStream | null;
  onStartCapture: () => Promise<MediaStream | null>;
  onStopCapture: () => void;
}

export function WebRtcSection(props: WebRtcSectionProps) {
  const rtc = useWebRtc();
  const [hostName, setHostName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [joinName, setJoinName] = useState("");
  const [busy, setBusy] = useState(false);

  // Suporte a entrar via ?room=XXXX na URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const r = url.searchParams.get("room");
    if (r) setJoinId(r);
  }, []);

  const handleCreate = async () => {
    if (!hostName.trim()) {
      toast.error("Digite um nome para criar a sala.");
      return;
    }
    setBusy(true);
    rtc.createRoom(hostName.trim());
    setBusy(false);
  };

  const handleJoin = async () => {
    if (!joinId.trim() || !joinName.trim()) {
      toast.error("Preencha o ID da sala e seu nome.");
      return;
    }
    setBusy(true);
    rtc.joinRoom(joinId.trim().toUpperCase(), joinName.trim());
    setBusy(false);
  };

  const handleStart = async () => {
    setBusy(true);
    try {
      const s = await props.onStartCapture();
      if (!s) return;
      await rtc.startStreaming(s, props.preset);
      toast.success("Transmitindo para os espectadores conectados.");
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    rtc.stopStreaming();
    props.onStopCapture();
    toast.info("Transmissão pausada.");
  };

  const copyLink = async () => {
    if (!rtc.roomLink) return;
    try {
      await navigator.clipboard.writeText(rtc.roomLink);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const isHost = rtc.roomId && rtc.peers.length >= 0 && rtc.status !== "idle";

  return (
    <div className="space-y-5">
      <Card className="glass border-white/10 rounded-3xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30">
              <Radio className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">WebRTC peer-to-peer</h3>
              <p className="text-sm text-foreground/65">
                Conecte dois dispositivos na mesma rede ou via internet. Útil
                para ver a tela do celular em um PC conectado à TV por HDMI.
              </p>
            </div>
          </div>

          {!rtc.roomId && (
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Anfitrião */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MonitorPlay className="h-4 w-4 text-fuchsia-300" />
                  Quero transmitir
                </div>
                <Input
                  placeholder="Seu nome"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
                <Button
                  onClick={handleCreate}
                  disabled={busy}
                  className="w-full btn-neon text-white"
                >
                  Criar sala
                </Button>
              </div>

              {/* Espectador */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-cyan-300" />
                  Quero assistir
                </div>
                <Input
                  placeholder="ID da sala"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  className="bg-white/5 border-white/10 uppercase"
                />
                <Input
                  placeholder="Seu nome"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
                <Button
                  onClick={handleJoin}
                  disabled={busy}
                  variant="outline"
                  className="w-full border-white/10 bg-white/5"
                >
                  Entrar na sala
                </Button>
              </div>
            </div>
          )}

          {rtc.roomId && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-foreground/60">
                    Sala ativa
                  </span>
                  <Button
                    onClick={() => rtc.leaveRoom()}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-300 hover:text-red-200"
                  >
                    <LogOut className="h-3 w-3 mr-1.5" />
                    Sair
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="font-mono text-base px-3 py-1.5 bg-indigo-500/20 border border-indigo-400/40 text-indigo-100">
                    {rtc.roomId}
                  </Badge>
                  <Button
                    onClick={copyLink}
                    variant="outline"
                    size="sm"
                    className="border-white/10 bg-white/5"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copiar link
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/55">
                  <Link2 className="h-3 w-3" />
                  <span className="truncate font-mono">{rtc.roomLink || "—"}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-foreground/60 mb-2 block">
                  Espectadores conectados
                </Label>
                {rtc.peers.length === 0 ? (
                  <div className="text-center py-4 text-sm text-foreground/55">
                    <Users className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
                    Compartilhe o link acima. Ninguém conectado ainda.
                  </div>
                ) : (
                  <ScrollArea className="max-h-40 rounded-2xl border border-white/10 bg-black/20">
                    <div className="p-2 space-y-1">
                      {rtc.peers.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-xl px-3 py-2 bg-white/5 flex items-center gap-2"
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot text-emerald-400" />
                          <span className="text-sm">{p.name}</span>
                          <span className="text-[10px] font-mono text-foreground/40 ml-auto">
                            {p.id.slice(0, 6)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}

          {rtc.error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-400/20 p-3 text-xs text-red-200">
              {rtc.error}
            </div>
          )}
        </CardContent>
      </Card>

      {isHost && (
        <>
          <QualityControls
            preset={props.preset}
            onPresetChange={props.onPresetChange}
            withAudio={props.withAudio}
            onWithAudioChange={props.onWithAudioChange}
          />

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleStart}
              disabled={busy || rtc.peers.length === 0}
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
              disabled={busy}
              variant="outline"
              className="h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
            >
              <Square className="h-4 w-4 mr-2" />
              Pausar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
