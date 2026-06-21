/**
 * MirrorTV — Mini-service de sinalização WebRTC
 * Porta: 3005
 *
 * Mantém salas (rooms) simples em memória e repassa mensagens SDP/ICE
 * entre os pares. Não processa mídia — apenas sinalização.
 */

import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 3005;

interface Peer {
  id: string;
  name: string;
  roomId: string;
}

const rooms = new Map<string, Map<string, Peer>>(); // roomId -> peerId -> Peer

function ensureRoom(roomId: string) {
  let room = rooms.get(roomId);
  if (!room) {
    room = new Map();
    rooms.set(roomId, room);
  }
  return room;
}

function genRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const io = new Server(
  createServer(),
  {
    path: "/",
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
    pingInterval: 25000,
  }
);

io.on("connection", (socket) => {
  let currentRoom: string | null = null;
  let currentName = socket.id.slice(0, 6);

  socket.on("create-room", ({ name }: { name: string }) => {
    const roomId = genRoomId();
    currentRoom = roomId;
    currentName = name || currentName;
    const room = ensureRoom(roomId);
    room.set(socket.id, { id: socket.id, name: currentName, roomId });
    socket.join(roomId);
    socket.emit("room-created", { roomId });
  });

  socket.on("join-room", ({ roomId, name }: { roomId: string; name: string }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("error-msg", { message: `Sala ${roomId} não existe` });
      return;
    }
    currentRoom = roomId;
    currentName = name || currentName;
    room.set(socket.id, { id: socket.id, name: currentName, roomId });
    socket.join(roomId);
    const peers = Array.from(room.values())
      .filter((p) => p.id !== socket.id)
      .map((p) => ({ id: p.id, name: p.name }));
    socket.emit("room-joined", { roomId, peers });
    // Avisa os outros que alguém entrou
    socket.to(roomId).emit("peer-joined", { id: socket.id, name: currentName });
  });

  socket.on("leave-room", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    room?.delete(socket.id);
    socket.to(currentRoom).emit("peer-left", { id: socket.id });
    socket.leave(currentRoom);
    if (room && room.size === 0) rooms.delete(currentRoom);
    currentRoom = null;
  });

  socket.on("sdp", ({ to, sdp }: { to: string; sdp: unknown }) => {
    if (!currentRoom) return;
    io.to(to).emit("sdp", { from: socket.id, sdp });
  });

  socket.on("ice", ({ to, candidate }: { to: string; candidate: unknown }) => {
    if (!currentRoom) return;
    io.to(to).emit("ice", { from: socket.id, candidate });
  });

  socket.on("disconnect", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    room?.delete(socket.id);
    socket.to(currentRoom).emit("peer-left", { id: socket.id });
    if (room && room.size === 0) rooms.delete(currentRoom);
  });
});

io.listen(PORT);
console.log(`[MirrorTV] Signaling service rodando na porta ${PORT}`);

process.on("SIGTERM", () => io.close(() => process.exit(0)));
process.on("SIGINT", () => io.close(() => process.exit(0)));
