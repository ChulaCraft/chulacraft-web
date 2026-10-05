import { createServer, type AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { parseStatusResponse, pingServer, readVarInt, statusRequest, writeVarInt } from "./server-status";

function statusPacket(json: object) {
  const text = Buffer.from(JSON.stringify(json), "utf8");
  const body = Buffer.concat([writeVarInt(0), writeVarInt(text.length), text]);
  return Buffer.concat([writeVarInt(body.length), body]);
}

const reply = {
  version: { name: "Folia 1.21.11", protocol: 774 },
  players: { online: 2, max: 100, sample: [{ name: "Mint", id: "x" }, { name: "<script>", id: "y" }] },
  description: { text: "ChulaCraft" },
};

describe("VarInt", () => {
  it("round-trips multi-byte and negative values", () => {
    for (const value of [0, 1, 127, 128, 25565, 2_097_151, -1]) {
      expect(readVarInt(writeVarInt(value))).toEqual([value, writeVarInt(value).length]);
    }
    expect(writeVarInt(-1)).toHaveLength(5);
  });

  it("asks for more bytes instead of misreading a split VarInt", () => {
    expect(readVarInt(Buffer.from([0x80]))).toBeNull();
  });
});

describe("statusRequest", () => {
  it("encodes handshake with next state 1 then an empty request", () => {
    const packet = statusRequest("mc.example", 25565);
    expect(packet.subarray(-2)).toEqual(Buffer.from([0x01, 0x00]));
    expect(packet.includes(Buffer.from("mc.example"))).toBe(true);
    expect(packet.includes(Buffer.from([0x63, 0xdd, 0x01]))).toBe(true); // port 25565 BE + state 1
  });
});

describe("parseStatusResponse", () => {
  it("waits for the whole packet, then keeps only safe player names", () => {
    const full = statusPacket(reply);
    expect(parseStatusResponse(full.subarray(0, 10))).toBeNull();
    expect(parseStatusResponse(full)).toEqual({
      online: true,
      players: { online: 2, max: 100, names: ["Mint"] },
      version: "Folia 1.21.11",
    });
  });

  it("rejects an unexpected packet id", () => {
    expect(() => parseStatusResponse(Buffer.from([0x02, 0x01, 0x00]))).toThrow();
  });
});

describe("pingServer", () => {
  it("reads a status reply split across TCP chunks", async () => {
    const server = createServer((socket) => {
      socket.once("data", () => {
        const packet = statusPacket(reply);
        socket.write(packet.subarray(0, 5));
        setTimeout(() => socket.end(packet.subarray(5)), 10);
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    try {
      const status = await pingServer(`127.0.0.1:${port}`);
      expect(status).toMatchObject({ online: true, players: { online: 2, max: 100 } });
    } finally {
      server.close();
    }
  });

  it("reports offline for a closed port or garbage reply", async () => {
    const server = createServer((socket) => socket.end(Buffer.from([0x03, 0x05, 0x00, 0x00])));
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    try {
      expect(await pingServer(`127.0.0.1:${port}`)).toEqual({ online: false });
    } finally {
      server.close();
    }
    expect(await pingServer(`127.0.0.1:${port}`)).toEqual({ online: false });
  });
});
