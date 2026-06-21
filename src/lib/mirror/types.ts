/**
 * Tipos compartilhados entre UI e hooks de protocolo.
 */

export type MirrorStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "connecting"
  | "streaming"
  | "paused"
  | "error";

export type ProtocolId = "cast" | "dlna" | "webrtc";

export interface QualityPreset {
  id: "low" | "medium" | "high";
  label: string;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number; // bps para WebRTC
  description: string;
}

export const QUALITY_PRESETS: QualityPreset[] = [
  {
    id: "low",
    label: "Econômico",
    width: 854,
    height: 480,
    frameRate: 24,
    bitrate: 800_000,
    description: "480p · 24fps · baixo consumo de rede",
  },
  {
    id: "medium",
    label: "Equilibrado",
    width: 1280,
    height: 720,
    frameRate: 30,
    bitrate: 1_800_000,
    description: "720p · 30fps · recomendado para Wi-Fi comum",
  },
  {
    id: "high",
    label: "Alta qualidade",
    width: 1920,
    height: 1080,
    frameRate: 60,
    bitrate: 4_000_000,
    description: "1080p · 60fps · requer Wi-Fi 5GHz",
  },
];

export interface DiscoveredDevice {
  id: string;
  name: string;
  protocol: ProtocolId;
  /** Endpoint de controle (DLNA SOAP, Cast receiver, etc.) */
  location?: string;
  /** Modelo/fabricante quando disponível */
  model?: string;
}

export interface ScreenCaptureState {
  status: MirrorStatus;
  stream: MediaStream | null;
  error: string | null;
  start: (preset: QualityPreset, opts?: { audio: boolean }) => Promise<MediaStream | null>;
  stop: () => void;
  updateTrackConstraints: (preset: QualityPreset) => Promise<void>;
}

declare global {
  interface Window {
    chrome?: {
      cast?: unknown;
    };
  }
}
