/**
 * Builds a print-ready "Scan to Join Our Rewards" counter poster by compositing
 * a business's QR code onto the branded template, instead of exporting a bare
 * black-and-white QR. The template lives in public/ so the same URL works in
 * the app and in production.
 *
 * The white placeholder box (inside the gold border) was measured from the
 * 1414x2000 template and is expressed as fractions, so it stays correct if the
 * template is ever re-exported at a different resolution (same artwork/ratio).
 */

import QRCode from 'qrcode';

const TEMPLATE_URL = '/counter-poster-template.webp';

/** White QR box inside the gold border, as fractions of the template size. */
const QR_BOX = { x: 0.2475, y: 0.315, w: 0.5057, h: 0.388 };
/** QR fills this fraction of the box's shorter side, leaving a clean margin. */
const QR_FILL = 0.86;

function loadImage(src: string, crossOrigin?: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

let templatePromise: Promise<HTMLImageElement> | null = null;
function loadTemplate(): Promise<HTMLImageElement> {
  if (!templatePromise) {
    templatePromise = loadImage(TEMPLATE_URL, true).catch((err) => {
      templatePromise = null; // allow a retry on the next download
      throw err;
    });
  }
  return templatePromise;
}

/** Returns a PNG data URL of the poster with the QR drawn into the placeholder. */
export async function buildCounterPoster(fullUrl: string): Promise<string> {
  const template = await loadTemplate();
  const W = template.naturalWidth;
  const H = template.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(template, 0, 0, W, H);

  const bx = QR_BOX.x * W;
  const by = QR_BOX.y * H;
  const bw = QR_BOX.w * W;
  const bh = QR_BOX.h * H;

  const qrSize = Math.round(Math.min(bw, bh) * QR_FILL);
  const qrDataUrl = await QRCode.toDataURL(fullUrl, {
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#111318', light: '#FFFFFF' },
  });
  const qrImg = await loadImage(qrDataUrl);

  const qx = Math.round(bx + (bw - qrSize) / 2);
  const qy = Math.round(by + (bh - qrSize) / 2);
  ctx.drawImage(qrImg, qx, qy, qrSize, qrSize);

  return canvas.toDataURL('image/png');
}

/** Builds the poster and triggers a browser download. */
export async function downloadCounterPoster(fullUrl: string, fileBase: string): Promise<void> {
  const dataUrl = await buildCounterPoster(fullUrl);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${fileBase}_counter_poster.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
