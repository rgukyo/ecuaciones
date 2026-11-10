import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size, draw) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = (size * 4 + 1) * y;
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = draw(x + 0.5, y + 0.5, size);
      const offset = row + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function mix(a, b, t) {
  return a.map((channel, index) => Math.round(channel + (b[index] - channel) * t));
}

function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / len;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function drawIcon(x, y, size, maskable) {
  const teal = [12, 92, 99, 255];
  const deep = [8, 66, 72, 255];
  const paper = [255, 253, 248, 255];
  const gold = [227, 155, 43, 255];
  const pad = maskable ? 0.18 : 0.08;
  const nx = x / size;
  const ny = y / size;
  const dx = nx - 0.5;
  const dy = ny - 0.5;
  let color = mix(teal, deep, Math.min(1, Math.hypot(dx, dy) * 1.3));
  const disk = Math.hypot(nx - 0.42, ny - 0.48);
  if (disk < 0.3) color = mix(color, [20, 120, 128, 255], 0.55);
  const thick = size * 0.045;
  const left = pad + 0.08;
  const right = 0.5;
  const top = 0.3;
  const bottom = 0.7;
  const xDist = Math.min(
    distSeg(nx, ny, left, top, right, bottom),
    distSeg(nx, ny, right, top, left, bottom)
  );
  if (xDist * size < thick) color = paper;
  const bar = size * 0.035;
  const y1 = 0.4;
  const y2 = 0.55;
  if (nx > 0.56 && nx < 0.84 && (Math.abs(ny - y1) * size < bar || Math.abs(ny - y2) * size < bar)) color = gold;
  return color;
}

mkdirSync(new URL("../icons/", import.meta.url), { recursive: true });
const dir = new URL("../icons/", import.meta.url);
writeFileSync(new URL("icon-192.png", dir), png(192, (x, y, size) => drawIcon(x, y, size, false)));
writeFileSync(new URL("icon-512.png", dir), png(512, (x, y, size) => drawIcon(x, y, size, false)));
writeFileSync(new URL("icon-maskable-512.png", dir), png(512, (x, y, size) => drawIcon(x, y, size, true)));
writeFileSync(new URL("apple-touch-icon.png", dir), png(180, (x, y, size) => drawIcon(x, y, size, false)));
