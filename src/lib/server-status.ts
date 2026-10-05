import { connect } from "node:net";
import { resolveSrv } from "node:dns/promises";

export type ServerStatus =
  | { online: false }
  | { online: true; players: { online: number; max: number; names: string[] }; version: string | null };

const PROTOCOL_VERSION = -1; // "any": the server still answers a status request.
const TIMEOUT_MS = 3000;
const MAX_RESPONSE_BYTES = 64 * 1024;

export function writeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  let v = value >>> 0;
  do {
    let byte = v & 0x7f;
    v >>>= 7;
    if (v !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (v !== 0);
  return Buffer.from(bytes);
}

/** Returns [value, bytesRead], or null when the buffer ends mid-VarInt. */
export function readVarInt(buffer: Buffer, offset = 0): [number, number] | null {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    if (offset + i >= buffer.length) return null;
    const byte = buffer[offset + i];
    value |= (byte & 0x7f) << (7 * i);
    if ((byte & 0x80) === 0) return [value, i + 1];
  }
  throw new Error("VarInt too long");
}

function packet(id: number, payload: Buffer): Buffer {
  const body = Buffer.concat([writeVarInt(id), payload]);
  return Buffer.concat([writeVarInt(body.length), body]);
}

/** Handshake (next state = status) followed by an empty status request. */
export function statusRequest(host: string, port: number): Buffer {
  const hostBytes = Buffer.from(host, "utf8");
  const portBytes = Buffer.alloc(2);
  portBytes.writeUInt16BE(port);
  const handshake = packet(0x00, Buffer.concat([
    writeVarInt(PROTOCOL_VERSION), writeVarInt(hostBytes.length), hostBytes, portBytes, writeVarInt(1),
  ]));
  return Buffer.concat([handshake, packet(0x00, Buffer.alloc(0))]);
}

/** Extracts the JSON string from a complete status response, or null if more bytes are needed. */
export function parseStatusResponse(buffer: Buffer): ServerStatus | null {
  const length = readVarInt(buffer);
  if (!length || buffer.length < length[1] + length[0]) return null;
  let offset = length[1];
  const id = readVarInt(buffer, offset);
  if (!id || id[0] !== 0x00) throw new Error("Unexpected packet");
  offset += id[1];
  const jsonLength = readVarInt(buffer, offset);
  if (!jsonLength) throw new Error("Truncated packet");
  offset += jsonLength[1];
  const json = JSON.parse(buffer.subarray(offset, offset + jsonLength[0]).toString("utf8"));
  return {
    online: true,
    players: {
      online: Number(json.players?.online) || 0,
      max: Number(json.players?.max) || 0,
      names: Array.isArray(json.players?.sample)
        ? json.players.sample.map((p: { name?: unknown }) => p.name).filter((n: unknown): n is string => typeof n === "string" && /^\w{1,16}$/.test(n))
        : [],
    },
    version: typeof json.version?.name === "string" ? json.version.name : null,
  };
}

/** Same lookup the Minecraft client does: SRV record first, then host:25565. */
async function resolveTarget(address: string): Promise<{ host: string; port: number }> {
  const [host, port] = address.split(":");
  if (port) return { host, port: Number(port) };
  try {
    const [record] = await resolveSrv(`_minecraft._tcp.${host}`);
    if (record) return { host: record.name, port: record.port };
  } catch { /* no SRV record */ }
  return { host, port: 25565 };
}

/** Server List Ping. Never throws: any failure (DNS, timeout, bad reply) reads as offline. */
export async function pingServer(address: string): Promise<ServerStatus> {
  try {
    const { host, port } = await resolveTarget(address);
    return await new Promise<ServerStatus>((resolve) => {
      const socket = connect({ host, port, timeout: TIMEOUT_MS });
      let received = Buffer.alloc(0);
      const finish = (status: ServerStatus) => { socket.destroy(); resolve(status); };
      socket.once("connect", () => socket.write(statusRequest(host, port)));
      socket.on("data", (chunk) => {
        received = Buffer.concat([received, chunk]);
        if (received.length > MAX_RESPONSE_BYTES) return finish({ online: false });
        try {
          const status = parseStatusResponse(received);
          if (status) finish(status);
        } catch {
          finish({ online: false });
        }
      });
      socket.once("timeout", () => finish({ online: false }));
      socket.once("error", () => finish({ online: false }));
      socket.once("close", () => finish({ online: false }));
    });
  } catch {
    return { online: false };
  }
}
