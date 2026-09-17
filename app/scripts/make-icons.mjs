/**
 * Generates the PWA icons without any image library: a violet tile with a
 * white dot. Run `node scripts/make-icons.mjs` after changing the brand colour.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const VIOLET = [0x54, 0x3f, 0xf8];
const OUT = new URL("../public/icons/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Violet square, white circle. Anti-aliased edge via distance coverage.
function tile(size) {
  const cx = size / 2, cy = size / 2, r = size * 0.26;
  return png(size, (x, y) => {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    const cov = Math.max(0, Math.min(1, r - d + 0.5));
    return [
      Math.round(VIOLET[0] + (255 - VIOLET[0]) * cov),
      Math.round(VIOLET[1] + (255 - VIOLET[1]) * cov),
      Math.round(VIOLET[2] + (255 - VIOLET[2]) * cov),
      255,
    ];
  });
}

writeFileSync(new URL("icon-192.png", OUT), tile(192));
writeFileSync(new URL("icon-512.png", OUT), tile(512));
writeFileSync(new URL("apple-touch-icon.png", OUT), tile(180));
writeFileSync(
  new URL("icon.svg", OUT),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#543ff8"/><circle cx="256" cy="256" r="133" fill="#fff"/></svg>\n`,
);
console.log("icons written");
