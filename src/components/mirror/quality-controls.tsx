"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { QUALITY_PRESETS, type QualityPreset } from "@/lib/mirror/types";
import { Gauge, Mic, MicOff } from "lucide-react";

interface QualityControlsProps {
  preset: QualityPreset;
  onPresetChange: (p: QualityPreset) => void;
  withAudio: boolean;
  onWithAudioChange: (v: boolean) => void;
  disabled?: boolean;
}

export function QualityControls({
  preset,
  onPresetChange,
  withAudio,
  onWithAudioChange,
  disabled,
}: QualityControlsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-foreground/60 flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5" />
          Qualidade da transmissão
        </Label>
        <ToggleGroup
          type="single"
          value={preset.id}
          onValueChange={(v) => {
            const next = QUALITY_PRESETS.find((p) => p.id === v);
            if (next) onPresetChange(next);
          }}
          disabled={disabled}
          className="grid grid-cols-3 gap-2"
        >
          {QUALITY_PRESETS.map((p) => (
            <ToggleGroupItem
              key={p.id}
              value={p.id}
              disabled={disabled}
              className="data-[state=on]:btn-neon data-[state=on]:text-white data-[state=on]:border-transparent border border-white/10 rounded-xl h-auto py-2.5 px-2 flex-col"
            >
              <span className="text-sm font-semibold">{p.label}</span>
              <span className="text-[10px] text-foreground/60 data-[state=on]:text-white/80 mt-0.5 text-center leading-tight">
                {p.width}×{p.height} · {p.frameRate}fps
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-foreground/50">{preset.description}</p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          {withAudio ? (
            <Mic className="h-4 w-4 text-emerald-300" />
          ) : (
            <MicOff className="h-4 w-4 text-foreground/50" />
          )}
          <div>
            <Label className="text-sm font-medium cursor-pointer">
              Áudio do sistema
            </Label>
            <p className="text-[11px] text-foreground/55">
              Captura o áudio da tela (YouTube, jogos, etc.)
            </p>
          </div>
        </div>
        <Switch
          checked={withAudio}
          onCheckedChange={onWithAudioChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
