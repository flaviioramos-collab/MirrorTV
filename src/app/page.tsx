"use client";

import { Suspense, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PreviewPanel } from "@/components/mirror/preview-panel";
import { CastSection } from "@/components/mirror/cast-section";
import { DlnaSection } from "@/components/mirror/dlna-section";
import { WebRtcSection } from "@/components/mirror/webrtc-section";
import { TutorialDialog } from "@/components/mirror/tutorial-dialog";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { useScreenCapture } from "@/lib/mirror/use-screen-capture";
import {
  QUALITY_PRESETS,
  type ProtocolId,
  type QualityPreset,
} from "@/lib/mirror/types";
import {
  Cast,
  Wifi,
  Radio,
  Moon,
  Sun,
  Tv2,
  Download,
  Smartphone,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

// Hook client-only para evitar hydration mismatch (React 19 safe)
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

const PROTOCOL_META: Record<
  ProtocolId,
  { label: string; short: string; icon: typeof Cast }
> = {
  cast: { label: "Chromecast", short: "Cast", icon: Cast },
  dlna: { label: "DLNA / UPnP", short: "DLNA", icon: Wifi },
  webrtc: { label: "WebRTC P2P", short: "WebRTC", icon: Radio },
};

function HomeContent() {
  const searchParams = useSearchParams();
  const initialProtocol = (searchParams.get("protocol") as ProtocolId) || "cast";
  const [protocol, setProtocol] = useState<ProtocolId>(
    initialProtocol && ["cast", "dlna", "webrtc"].includes(initialProtocol)
      ? initialProtocol
      : "cast"
  );
  const [preset, setPreset] = useState<QualityPreset>(QUALITY_PRESETS[1]);
  const [withAudio, setWithAudio] = useState(true);
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);

  const capture = useScreenCapture({
    onEnded: () => toast.info("Captura de tela encerrada."),
  });

  // Captura evento de instalação PWA
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const doInstall = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice;
    setInstallEvt(null);
  };

  const handleStartCapture = useCallback(async () => {
    const s = await capture.start(preset, { audio: withAudio });
    if (s) {
      // aplica constraints atualizadas imediatamente
      await capture.updateTrackConstraints(preset);
    }
    return s;
  }, [capture, preset, withAudio]);

  const handleStopCapture = useCallback(() => {
    capture.stop();
  }, [capture]);

  // Troca de qualidade em tempo real quando o stream está ativo
  const handlePresetChange = useCallback(
    async (p: QualityPreset) => {
      setPreset(p);
      if (capture.stream) {
        await capture.updateTrackConstraints(p);
        toast.success(`Qualidade alterada para ${p.label}.`);
      }
    },
    [capture]
  );

  // Lê ?protocol= da URL (shortcut vindo do manifest) — resolvido via
  // useSearchParams na inicialização do useState acima.

  const protoMeta = PROTOCOL_META[protocol];
  const isStreaming =
    capture.status === "streaming" || capture.status === "ready";

  return (
    <main className="min-h-screen flex flex-col">
      <ServiceWorkerRegister />

      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <Tv2 className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-tight truncate">
                <span className="text-gradient-brand">MirrorTV</span>
              </h1>
              <p className="text-[11px] text-foreground/55 leading-tight hidden sm:block">
                Espelhar celular para Smart TV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {installEvt && (
              <Button
                onClick={doInstall}
                size="sm"
                className="btn-neon text-white rounded-full h-9"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Instalar
              </Button>
            )}
            <TutorialDialog />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full h-9 w-9 border border-white/10 bg-white/5 hover:bg-white/10"
              aria-label="Alternar tema"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero */}
        <section className="rounded-3xl bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-cyan-500/15 border border-white/10 p-5 sm:p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <h2 className="text-xl sm:text-2xl font-bold leading-tight">
                Espelhe seu Android para{" "}
                <span className="text-gradient-brand">qualquer Smart TV</span>
              </h2>
              <p className="text-sm text-foreground/65 mt-1.5">
                Três protocolos em um app: Chromecast, DLNA/UPnP e WebRTC
                peer-to-peer. Instale como PWA e use como app nativo.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/60">
              <Smartphone className="h-4 w-4" />
              <span>Android 9+ com Chrome</span>
            </div>
          </div>
        </section>

        {/* Preview */}
        <PreviewPanel
          stream={capture.stream}
          status={capture.status}
          error={capture.error}
          protocolLabel={protoMeta.label}
        />

        {/* Tabs de protocolo */}
        <Tabs
          value={protocol}
          onValueChange={(v) => setProtocol(v as ProtocolId)}
          className="space-y-5"
        >
          <TabsList className="grid grid-cols-3 h-12 bg-white/5 border border-white/10 rounded-2xl p-1">
            {(["cast", "dlna", "webrtc"] as const).map((p) => {
              const meta = PROTOCOL_META[p];
              return (
                <TabsTrigger
                  key={p}
                  value={p}
                  className="data-[state=active]:btn-neon data-[state=active]:text-white data-[state=active]:border-transparent rounded-xl text-xs sm:text-sm"
                >
                  <meta.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                  <span className="hidden xs:inline sm:inline">{meta.short}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="cast" className="mt-0">
            <CastSection
              preset={preset}
              onPresetChange={handlePresetChange}
              withAudio={withAudio}
              onWithAudioChange={setWithAudio}
              stream={capture.stream}
              onStartCapture={handleStartCapture}
              onStopCapture={handleStopCapture}
            />
          </TabsContent>
          <TabsContent value="dlna" className="mt-0">
            <DlnaSection
              preset={preset}
              onPresetChange={handlePresetChange}
              withAudio={withAudio}
              onWithAudioChange={setWithAudio}
              stream={capture.stream}
              onStartCapture={handleStartCapture}
              onStopCapture={handleStopCapture}
            />
          </TabsContent>
          <TabsContent value="webrtc" className="mt-0">
            <WebRtcSection
              preset={preset}
              onPresetChange={handlePresetChange}
              withAudio={withAudio}
              onWithAudioChange={setWithAudio}
              stream={capture.stream}
              onStartCapture={handleStartCapture}
              onStopCapture={handleStopCapture}
            />
          </TabsContent>
        </Tabs>

        {/* Dica rápida */}
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-foreground/55 leading-relaxed">
          <p>
            <strong className="text-foreground/75">Dica:</strong> este app é uma
            PWA. Em produção (HTTPS), ele aparece como instalável no Android e
            funciona em tela cheia. Em ambiente de preview sem HTTPS, a captura
            de tela e o Cast podem ser limitados pelo navegador.
          </p>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-5 px-4 text-center text-xs text-foreground/50">
        MirrorTV · PWA Open Source · Next.js + WebRTC + Cast SDK + DLNA
      </footer>
    </main>
  );
}

// Tipo para o evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Wrapper com Suspense para evitar SSR mismatch
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <HomeContent />
    </Suspense>
  );
}
