import { deflateSync } from "node:zlib";

// /gallery fixtures: one group with a cover, one without (falls back to its
// first picture) and one empty (hidden). Pictures are solid-colour PNGs.
export const GALLERY_COVERED = "a0000000-0000-4000-8000-000000000001";
export const GALLERY_PLAIN = "a0000000-0000-4000-8000-000000000002";
export const GALLERY_EMPTY = "a0000000-0000-4000-8000-000000000003";

const file = (n) => `gallery/b0000000-0000-4000-8000-00000000000${n}.png`;
const COLORS = { 1: [255, 106, 162], 2: [108, 196, 255], 3: [92, 214, 139], 4: [255, 181, 71], 5: [157, 134, 255], 6: [255, 93, 93] };

const groups = [
  { id: GALLERY_COVERED, name: "Lobby building day", description: "Everyone pitched in on the new spawn.", cover_path: file(6) },
  { id: GALLERY_PLAIN, name: "First Ender Dragon", description: "", cover_path: null },
  { id: GALLERY_EMPTY, name: "Nothing here yet", description: "", cover_path: null },
];
const images = [
  { id: "c0000000-0000-4000-8000-000000000001", group_id: GALLERY_COVERED, image_path: file(1), alt: "The lobby at sunrise", wide: true },
  { id: "c0000000-0000-4000-8000-000000000002", group_id: GALLERY_COVERED, image_path: file(2), alt: "A bridge to the spawn", wide: false },
  { id: "c0000000-0000-4000-8000-000000000003", group_id: GALLERY_COVERED, image_path: file(3), alt: "Builders on the roof", wide: false },
  { id: "c0000000-0000-4000-8000-000000000004", group_id: GALLERY_PLAIN, image_path: file(4), alt: "The dragon falls", wide: false },
  { id: "c0000000-0000-4000-8000-000000000005", group_id: GALLERY_PLAIN, image_path: file(5), alt: "The celebration", wide: false },
];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc(body), body.length + 4);
  return out;
};
const png = (rgb) => {
  const w = 480, h = 320;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(w, 0);
  header.writeUInt32BE(h, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => rgb).flat())]);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(Array.from({ length: h }, () => row)))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

export default function gallery({ request, response, url, json }) {
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/list_gallery_groups") {
    json(response, 200, groups);
    return true;
  }
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/list_gallery") {
    json(response, 200, images);
    return true;
  }
  const match = url.pathname.match(/^\/storage\/v1\/object\/public\/achievements\/gallery\/b0000000-0000-4000-8000-00000000000(\d)\.png$/);
  if (request.method === "GET" && match) {
    response.writeHead(200, { "content-type": "image/png" });
    response.end(png(COLORS[match[1]]));
    return true;
  }
  return false;
}
