// Gera os ícones PWA (192, 512, maskable 512) para o MirrorTV.
// Estilo: gradiente índigo→magenta→cyan com símbolo de espelhamento (TV + seta).
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const PUBLIC = path.resolve("/home/z/my-project/public");

// Gradiente SVG: índigo→magenta→cyan
function bgGradient(size: number, padding: number) {
  const s = size - padding * 2;
  return `
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6d28d9"/>
        <stop offset="55%" stop-color="#9333ea"/>
        <stop offset="100%" stop-color="#06b6d4"/>
      </linearGradient>
      <linearGradient id="stroke" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a5b4fc"/>
        <stop offset="100%" stop-color="#67e8f9"/>
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="b"/>
        <feMerge>
          <feMergeNode in="b"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect x="${padding}" y="${padding}" width="${s}" height="${s}" rx="${s * 0.22}" fill="url(#bg)"/>
  `;
}

function tvIcon(size: number, padding: number) {
  const cx = size / 2;
  const tvW = size * 0.46;
  const tvH = size * 0.32;
  const tvX = cx - tvW / 2;
  const tvY = padding + size * 0.22;
  const screenR = tvH * 0.12;
  const standW = tvW * 0.22;
  const standY = tvY + tvH + size * 0.04;
  // Seta de espelhamento (curva indo do canto inferior direito para a TV)
  return `
    <rect x="${tvX}" y="${tvY}" width="${tvW}" height="${tvH}" rx="${screenR}"
      fill="none" stroke="url(#stroke)" stroke-width="${size * 0.025}" filter="url(#glow)"/>
    <rect x="${cx - standW / 2}" y="${standY}" width="${standW}" height="${size * 0.05}"
      rx="${size * 0.012}" fill="url(#stroke)"/>
    <path d="M ${cx + tvW * 0.15} ${tvY + tvH + size * 0.18}
             Q ${cx + tvW * 0.45} ${tvY + tvH + size * 0.18} ${cx + tvW * 0.45} ${tvY + tvH + size * 0.04}"
      fill="none" stroke="#67e8f9" stroke-width="${size * 0.03}" stroke-linecap="round" filter="url(#glow)"/>
    <polygon points="${cx + tvW * 0.45},${tvY + tvH + size * 0.02} ${cx + tvW * 0.36},${tvY + tvH + size * 0.1} ${cx + tvW * 0.5},${tvY + tvH + size * 0.1}"
      fill="#67e8f9" filter="url(#glow)"/>
    <circle cx="${cx - tvW * 0.18}" cy="${tvY + tvH * 0.5}" r="${size * 0.04}" fill="#a5b4fc" opacity="0.9"/>
  `;
}

function buildSvg(size: number, maskable: boolean) {
  const padding = maskable ? size * 0.12 : size * 0.06;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bgGradient(size, padding)}
    ${tvIcon(size, padding)}
  </svg>`;
}

async function main() {
  const targets = [
    { name: "icon-192.png", size: 192, maskable: false },
    { name: "icon-512.png", size: 512, maskable: false },
    { name: "icon-maskable-512.png", size: 512, maskable: true },
    { name: "apple-touch-icon.png", size: 180, maskable: false },
  ];
  for (const t of targets) {
    const svg = Buffer.from(buildSvg(t.size, t.maskable));
    const out = path.join(PUBLIC, t.name);
    await sharp(svg).png().toFile(out);
    console.log("Generated:", out);
  }
  // Também gera um favicon.svg
  const favSvg = buildSvg(64, false);
  await fs.writeFile(path.join(PUBLIC, "favicon.svg"), favSvg, "utf8");
  console.log("Generated favicon.svg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
