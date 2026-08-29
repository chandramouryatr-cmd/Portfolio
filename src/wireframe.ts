// Generates a small abstract "screen" skeleton as an SVG data string,
// used as a placeholder cover for each work card. Soft rounded blocks
// on a light panel, like a UI still loading in — one block per cover
// carries a brushed-metal gradient fill as the accent.

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function wireframeCover(seed: number): string {
  const rand = mulberry32(seed * 97 + 13);
  const w = 640;
  const h = 480;
  const rects: string[] = [];
  const fill = "#E6E7EA";
  const fillDim = "#EFF0F2";
  const r = 6;

  const metalId = `metal${seed}`;
  const defs = `
    <defs>
      <linearGradient id="${metalId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F4F5F7"/>
        <stop offset="45%" stop-color="#B9BBC1"/>
        <stop offset="55%" stop-color="#DCDDE1"/>
        <stop offset="100%" stop-color="#8C8F97"/>
      </linearGradient>
    </defs>`;

  const hasSidebar = seed % 2 === 0;
  let contentX = 28;
  const contentY = 28;

  if (hasSidebar) {
    const sw = 88;
    rects.push(`<rect x="28" y="${contentY}" width="${sw}" height="${h - contentY - 28}" rx="${r}" fill="${fillDim}"/>`);
    for (let i = 0; i < 4; i++) {
      const yy = contentY + 22 + i * 32;
      rects.push(`<rect x="44" y="${yy}" width="${sw - 32}" height="8" rx="4" fill="${fill}"/>`);
    }
    contentX = 28 + sw + 20;
  }

  const contentW = w - contentX - 28;

  const heroH = 96 + rand() * 28;
  rects.push(`<rect x="${contentX}" y="${contentY}" width="${contentW}" height="${heroH}" rx="${r}" fill="url(#${metalId})"/>`);

  const gridY = contentY + heroH + 18;
  const cols = 2 + Math.floor(rand() * 2);
  const gap = 16;
  const cardW = (contentW - gap * (cols - 1)) / cols;
  const cardH = 68 + rand() * 22;
  for (let c = 0; c < cols; c++) {
    const cx = contentX + c * (cardW + gap);
    rects.push(`<rect x="${cx}" y="${gridY}" width="${cardW}" height="${cardH}" rx="${r}" fill="${fillDim}"/>`);
    rects.push(`<rect x="${cx + 12}" y="${gridY + 14}" width="${cardW - 24}" height="7" rx="3.5" fill="${fill}"/>`);
    rects.push(`<rect x="${cx + 12}" y="${gridY + 28}" width="${cardW - 44}" height="5" rx="2.5" fill="${fill}"/>`);
  }

  const textY = gridY + cardH + 22;
  if (textY + 10 < h - 28) {
    rects.push(`<rect x="${contentX}" y="${textY}" width="${contentW * 0.4}" height="8" rx="4" fill="${fillDim}"/>`);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${defs}${rects.join("")}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
