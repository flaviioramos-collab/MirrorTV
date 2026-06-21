"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Download,
  Cast,
  Wifi,
  HelpCircle,
  CheckCircle2,
  Tv,
} from "lucide-react";
import { useState } from "react";

const STEPS_INSTALL = [
  {
    icon: Smartphone,
    title: "Abra no Chrome do Android",
    desc: "No seu celular, abra este app no Google Chrome ou Microsoft Edge. Outros navegadores não suportam PWA com captura de tela.",
  },
  {
    icon: Download,
    title: "Menu → Adicionar à tela inicial",
    desc: "Toque nos três pontos no canto superior direito do Chrome e selecione “Adicionar à tela inicial”. O app será instalado com ícone próprio.",
  },
  {
    icon: CheckCircle2,
    title: "Abra pelo ícone",
    desc: "Agora você pode abrir o MirrorTV direto da tela inicial, em tela cheia, como um app nativo.",
  },
];

const STEPS_CONNECT = [
  {
    icon: Wifi,
    title: "Mesma rede Wi-Fi",
    desc: "Celular e TV precisam estar conectados ao mesmo Wi-Fi. Redes de hoteis/corporativas com isolamento de clientes podem bloquear a descoberta.",
  },
  {
    icon: Cast,
    title: "Escolha o protocolo",
    desc: "Use Chromecast para TVs modernas (2018+), DLNA para receptores antigos, ou WebRTC para transmitir para outro dispositivo.",
  },
  {
    icon: Tv,
    title: "Selecione a TV",
    desc: "Toque em “Selecionar TV” (Cast) ou escolha um dispositivo da lista (DLNA). O espelho começa em segundos.",
  },
];

export function TutorialDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-foreground/80"
        >
          <HelpCircle className="h-4 w-4 mr-1.5" />
          Como usar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg glass-strong border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Como usar o MirrorTV</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-300 mb-3">
              Instalar no Android
            </h3>
            <ol className="space-y-3">
              {STEPS_INSTALL.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <div className="shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.title}</p>
                    <p className="text-xs text-foreground/65 mt-0.5 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-300 mb-3">
              Conectar na TV
            </h3>
            <ol className="space-y-3">
              {STEPS_CONNECT.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <div className="shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.title}</p>
                    <p className="text-xs text-foreground/65 mt-0.5 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl bg-amber-500/10 border border-amber-400/20 p-3 text-xs text-amber-200">
            <strong className="block mb-1">Atenção</strong>
            A captura de tela (getDisplayMedia) só funciona em HTTPS ou em
            localhost. Em rede local sem HTTPS, o navegador bloqueia o acesso.
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
