"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { DiscoveredDevice, MirrorStatus, QualityPreset } from "@/lib/mirror/types";

const SIGNALING_PORT = 3005;

type Listener = (data: unknown) => void;

interface PeerEntry {
  id: string;
  name: string;
  pc: RTCPeerConnection | null;
}

export interface UseWebRtcReturn {
  status: MirrorStatus;
  roomId: string;
  roomLink: string;
  myPeerId: string;
  peers: DiscoveredDevice[];
  connected: boolean;
  error: string | null;
  createRoom: (name: string) => void;
  joinRoom: (roomId: string, name: string) => void;
  leaveRoom: () => void;
  startStreaming: (stream: MediaStream, preset: QualityPreset) => Promise<void>;
  stopStreaming: () => void;
}

/**
 * WebRTC peer-to-peer com signaling via mini-service (porta 3005).
 *
 * Fluxo:
 *  - Anfitrião cria sala -> recebe roomId -> compartilha link
 *  - Espectador entra na sala -> anfitrião recebe 'peer-joined' ->
 *    adiciona track do MediaStream ao peer -> envia offer -> espectador
 *    responde -> streaming começa.
 *
 * O navegador que está espelhando (anfitrião) envia a tela capturada para
 * o navegador espectador, que pode estar em outra aba, outro celular ou
 * em um PC conectado à TV via HDMI.
 */
export function useWebRtc(): UseWebRtcReturn {
  const [status, setStatus] = useState<MirrorStatus>("idle");
  const [roomId, setRoomId] = useState<string>("");
  const [myPeerId, setMyPeerId] = useState<string>("");
  const [peers, setPeers] = useState<DiscoveredDevice[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerMapRef = useRef<Map<string, PeerEntry>>(new Map());
  const isHostRef = useRef<boolean>(false);

  const ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ];

  const ensureSocket = useCallback((): Socket => {
    if (socketRef.current && socketRef.current.connected) {
      return socketRef.current;
    }
    const sock = io(`/?XTransformPort=${SIGNALING_PORT}`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 800,
    });
    sock.on("connect", () => {
      setMyPeerId(sock.id || "");
      setConnected(true);
      setError(null);
    });
    sock.on("disconnect", () => setConnected(false));
    sock.on("connect_error", () => {
      setError(
        "Não foi possível conectar ao servidor de sinalização. Verifique sua rede."
      );
    });
    socketRef.current = sock;
    return sock;
  }, []);

  const buildPeer = useCallback(
    async (sock: Socket, peer: PeerEntry, asOffer = true) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peer.pc = pc;
      // Anfitrião: adicionar tracks do MediaStream capturado
      if (isHostRef.current && streamRef.current) {
        for (const t of streamRef.current.getTracks()) {
          pc.addTrack(t, streamRef.current);
        }
      }
      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          sock.emit("ice", { to: peer.id, candidate: ev.candidate.toJSON() });
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("streaming");
        if (pc.connectionState === "failed") setStatus("error");
      };
      if (asOffer && isHostRef.current) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sock.emit("sdp", { to: peer.id, sdp: offer });
      }
    },
    []
  );

  // Handlers do protocolo de sinalização.
  const wireSignaling = useCallback(
    (sock: Socket) => {
      sock.off("room-created").on("room-created", (payload: { roomId: string }) => {
        setRoomId(payload.roomId);
        setStatus("ready");
      });
      sock.off("room-joined").on("room-joined", (payload: { roomId: string; peers: { id: string; name: string }[] }) => {
        setRoomId(payload.roomId);
        // Para cada peer já existente, nós (recém-chegados) esperamos offer
        const list: DiscoveredDevice[] = payload.peers.map((p) => ({
          id: p.id,
          name: p.name,
          protocol: "webrtc",
        }));
        setPeers(list);
        setStatus("ready");
      });
      sock.off("peer-joined").on("peer-joined", async (payload: { id: string; name: string }) => {
        if (!isHostRef.current) return;
        const peer: PeerEntry = { id: payload.id, name: payload.name, pc: null };
        peerMapRef.current.set(payload.id, peer);
        setPeers((prev) => [
          ...prev,
          { id: payload.id, name: payload.name, protocol: "webrtc" },
        ]);
        await buildPeer(sock, peer);
      });
      sock.off("peer-left").on("peer-left", (payload: { id: string }) => {
        const p = peerMapRef.current.get(payload.id);
        p?.pc?.close();
        peerMapRef.current.delete(payload.id);
        setPeers((prev) => prev.filter((d) => d.id !== payload.id));
      });
      sock.off("sdp").on("sdp", async (payload: { from: string; sdp: RTCSessionDescriptionInit }) => {
        let peer = peerMapRef.current.get(payload.from);
        if (!peer) {
          peer = { id: payload.from, name: payload.from.slice(0, 6), pc: null };
          peerMapRef.current.set(payload.from, peer);
          setPeers((prev) =>
            prev.some((d) => d.id === payload.from)
              ? prev
              : [...prev, { id: payload.from, name: peer!.name, protocol: "webrtc" }]
          );
        }
        if (!peer.pc) await buildPeer(sock, peer, /*asOffer*/ false);
        try {
          await peer.pc!.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          if (payload.sdp.type === "offer") {
            const ans = await peer.pc!.createAnswer();
            await peer.pc!.setLocalDescription(ans);
            sock.emit("sdp", { to: payload.from, sdp: ans });
          }
        } catch (e) {
          console.warn("SDP exchange falhou", e);
        }
      });
      sock.off("ice").on("ice", async (payload: { from: string; candidate: RTCIceCandidateInit }) => {
        const peer = peerMapRef.current.get(payload.from);
        if (!peer?.pc) return;
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.warn("ICE add falhou", e);
        }
      });
    },
    [buildPeer]
  );

  const createRoom = useCallback(
    (name: string) => {
      const sock = ensureSocket();
      wireSignaling(sock);
      isHostRef.current = true;
      setStatus("connecting");
      sock.emit("create-room", { name });
    },
    [ensureSocket, wireSignaling]
  );

  const joinRoom = useCallback(
    (id: string, name: string) => {
      const sock = ensureSocket();
      wireSignaling(sock);
      isHostRef.current = false;
      setStatus("connecting");
      sock.emit("join-room", { roomId: id, name });
    },
    [ensureSocket, wireSignaling]
  );

  const leaveRoom = useCallback(() => {
    const sock = socketRef.current;
    if (sock) {
      sock.emit("leave-room", {});
    }
    peerMapRef.current.forEach((p) => p.pc?.close());
    peerMapRef.current.clear();
    setPeers([]);
    setRoomId("");
    setStatus("idle");
  }, []);

  const startStreaming = useCallback(
    async (stream: MediaStream, _preset: QualityPreset) => {
      streamRef.current = stream;
      // Se já há peers conectados, adiciona os tracks a eles (novo fluxo).
      for (const peer of peerMapRef.current.values()) {
        if (!peer.pc) continue;
        // Substitui tracks existentes ou adiciona novos
        const senders = peer.pc.getSenders();
        for (const t of stream.getTracks()) {
          const existing = senders.find((s) => s.track && s.track.kind === t.kind);
          if (existing) {
            await existing.replaceTrack(t);
          } else {
            peer.pc.addTrack(t, stream);
          }
        }
        // Renegotiate
        const offer = await peer.pc.createOffer();
        await peer.pc.setLocalDescription(offer);
        socketRef.current?.emit("sdp", { to: peer.id, sdp: offer });
      }
      setStatus("streaming");
    },
    []
  );

  const stopStreaming = useCallback(() => {
    peerMapRef.current.forEach((p) => {
      p.pc?.getSenders().forEach((s) => {
        try {
          if (s.track) s.track.stop();
        } catch {
          /* noop */
        }
      });
    });
    streamRef.current = null;
    setStatus("ready");
  }, []);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      peerMapRef.current.forEach((p) => p.pc?.close());
      peerMapRef.current.clear();
    };
  }, []);

  // Link público para compartilhar com espectadores
  const roomLink = typeof window !== "undefined" && roomId
    ? `${window.location.origin}/?room=${roomId}`
    : "";

  return {
    status,
    roomId,
    roomLink,
    myPeerId,
    peers,
    connected,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    startStreaming,
    stopStreaming,
  };
}
