const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const images = [
  {
    in: 'public/assets/aistudio/TAWHIRIMATEA_afb482f5.jpg',
    out: 'public/assets/aistudio/TAWHIRIMATEA_transparent.png',
  },
  {
    in: 'public/assets/aistudio/TUMATAUENGA_0845bda5.jpg',
    out: 'public/assets/aistudio/TUMATAUENGA_transparent.png',
  },
  {
    in: 'public/assets/aistudio/TANGAROA_0af8fc15.jpg',
    out: 'public/assets/aistudio/TANGAROA_transparent.png',
  },
  {
    in: 'public/assets/aistudio/TANE_MAHUTA_98585aa3.jpg',
    out: 'public/assets/aistudio/TANE_MAHUTA_transparent.png',
  },
];

images.forEach(({ in: inPath, out: outPath }) => {
  const fullIn = path.resolve(inPath);
  const fullOut = path.resolve(outPath);

  if (!fs.existsSync(fullIn)) {
    console.error('File not found:', fullIn);
    return;
  }

  const jpegData = fs.readFileSync(fullIn);
  const raw = jpeg.decode(jpegData, { useTArray: true });
  const { width, height, data } = raw;

  const png = new PNG({ width, height });

  // Flood fill / background removal from border pixels:
  // We can do a flood fill starting from all 4 borders to remove the surrounding white background,
  // which ensures white accents inside the crest (if any) are preserved while outer background is completely removed!
  const visited = new Uint8Array(width * height);
  const queue = [];

  const isBg = (idx) => {
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];
    // Threshold for white/near-white background
    return r >= 235 && g >= 235 && b >= 235;
  };

  // Seed queue with border pixels
  for (let x = 0; x < width; x++) {
    const topIdx = x;
    const botIdx = (height - 1) * width + x;
    if (isBg(topIdx) && !visited[topIdx]) {
      visited[topIdx] = 1;
      queue.push(topIdx);
    }
    if (isBg(botIdx) && !visited[botIdx]) {
      visited[botIdx] = 1;
      queue.push(botIdx);
    }
  }

  for (let y = 0; y < height; y++) {
    const leftIdx = y * width;
    const rightIdx = y * width + (width - 1);
    if (isBg(leftIdx) && !visited[leftIdx]) {
      visited[leftIdx] = 1;
      queue.push(leftIdx);
    }
    if (isBg(rightIdx) && !visited[rightIdx]) {
      visited[rightIdx] = 1;
      queue.push(rightIdx);
    }
  }

  // BFS Flood Fill
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      cy > 0 ? (cy - 1) * width + cx : -1,
      cy < height - 1 ? (cy + 1) * width + cx : -1,
      cx > 0 ? cy * width + (cx - 1) : -1,
      cx < width - 1 ? cy * width + (cx + 1) : -1,
    ];

    for (const n of neighbors) {
      if (n !== -1 && !visited[n] && isBg(n)) {
        visited[n] = 1;
        queue.push(n);
      }
    }
  }

  // Copy into PNG and set alpha
  for (let i = 0; i < width * height; i++) {
    const px = i * 4;
    const r = data[px];
    const g = data[px + 1];
    const b = data[px + 2];

    png.data[px] = r;
    png.data[px + 1] = g;
    png.data[px + 2] = b;

    if (visited[i]) {
      png.data[px + 3] = 0; // Transparent outer background!
    } else {
      // Also catch any stray near-white pixels on the edges
      if (r > 248 && g > 248 && b > 248) {
        png.data[px + 3] = 0;
      } else {
        png.data[px + 3] = 255;
      }
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(fullOut, buffer);
  console.log('Saved transparent crest:', fullOut);
});
