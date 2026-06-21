/**
 * MirrorTV — Mini-service DLNA/UPnP
 * Porta: 3004
 *
 * Responsabilidades:
 *  1. Descoberta SSDP de Media Renderers na rede local (rota GET /scan).
 *  2. Comando SetAVTransportURI para iniciar playback de uma URL na TV (POST /cast).
 *  3. Comandos Play / Pause / Stop via SOAP (POST /control).
 *
 * Por que um mini-service? Browsers não conseguem enviar pacotes UDP SSDP
 * nem fazer chamadas SOAP cross-origin para TVs DLNA. O Node resolve isso.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { Client as SsdpClient } from "node-ssdp";
import MediaRendererClient from "upnp-mediarenderer-client";

const PORT = 3004;

interface DlnaDevice {
  id: string;
  name: string;
  protocol: "dlna";
  location: string;
  model?: string;
}

const devices = new Map<string, DlnaDevice>();
const clients = new Map<string, InstanceType<typeof MediaRendererClient>>();

function cors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res: ServerResponse, status: number, body: unknown) {
  cors(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function scan(): Promise<DlnaDevice[]> {
  const client = new SsdpClient();
  const found: DlnaDevice[] = [];
  const seen = new Set<string>();

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      try {
        client.stop();
      } catch {
        /* noop */
      }
      resolve(found);
    }, 4000);

    client.on("response", (headers: Record<string, string>) => {
      const loc = headers.LOCATION;
      if (!loc || seen.has(loc)) return;
      seen.add(loc);
      const name =
        headers["ST"]?.includes("MediaRenderer") && headers.SERVER
          ? headers.SERVER.replace(/^.+?,\s*/, "").split(",")[0].trim()
          : `Dispositivo DLNA ${found.length + 1}`;
      const dev: DlnaDevice = {
        id: loc,
        name,
        protocol: "dlna",
        location: loc,
        model: headers.SERVER,
      };
      found.push(dev);
      devices.set(loc, dev);
    });

    try {
      client.search("urn:schemas-upnp-org:device:MediaRenderer:1");
    } catch (e) {
      console.warn("SSDP search falhou", e);
    }

    void timeout;
  });
}

function getClient(deviceId: string) {
  let c = clients.get(deviceId);
  if (!c) {
    c = new MediaRendererClient(deviceId);
    clients.set(deviceId, c);
  }
  return c;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (path === "/api/dlna/scan" && req.method === "GET") {
    try {
      const list = await scan();
      json(res, 200, { devices: list });
    } catch (e) {
      json(res, 500, { error: (e as Error).message });
    }
    return;
  }

  if (path === "/api/dlna/cast" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req)) as {
        deviceId: string;
        url: string;
        mimeType?: string;
      };
      const c = getClient(body.deviceId);
      await new Promise<void>((resolve, reject) => {
        c.load(body.url, { contentType: body.mimeType || "video/mp4" }, (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });
      json(res, 200, { ok: true });
    } catch (e) {
      json(res, 500, { ok: false, error: (e as Error).message });
    }
    return;
  }

  if (path === "/api/dlna/control" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req)) as {
        deviceId: string;
        cmd: "Play" | "Pause" | "Stop";
      };
      const c = getClient(body.deviceId);
      await new Promise<void>((resolve, reject) => {
        c[body.cmd.toLowerCase() as "play" | "pause" | "stop"](
          (err: Error | null) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      json(res, 200, { ok: true });
    } catch (e) {
      json(res, 500, { ok: false, error: (e as Error).message });
    }
    return;
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`[MirrorTV] DLNA service rodando na porta ${PORT}`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
