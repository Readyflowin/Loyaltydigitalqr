import puppeteer from 'puppeteer-core';
import path from 'path';

async function measureRef() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 682 });

  const refPath = 'file:///' + path.resolve('public/reference-hero.png').replace(/\\/g, '/');
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;">
        <canvas id="c" width="1024" height="682"></canvas>
      </body>
    </html>
  `);

  const bounds = await page.evaluate(async (imgSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, 1024, 682).data;

        function getPixel(x, y) {
          const idx = (y * 1024 + x) * 4;
          return [data[idx], data[idx+1], data[idx+2], data[idx+3]];
        }

        // Find lime panel (#D6FF38: roughly R: 200-230, G: 245-255, B: 30-70)
        let minLimeX = 1024, maxLimeX = 0, minLimeY = 682, maxLimeY = 0;
        for (let y = 0; y < 682; y++) {
          for (let x = 400; x < 1024; x++) {
            const [r, g, b] = getPixel(x, y);
            if (r > 190 && r < 235 && g > 230 && b < 80) {
              if (x < minLimeX) minLimeX = x;
              if (x > maxLimeX) maxLimeX = x;
              if (y < minLimeY) minLimeY = y;
              if (y > maxLimeY) maxLimeY = y;
            }
          }
        }

        resolve({
          limePanel: { minX: minLimeX, maxX: maxLimeX, minY: minLimeY, maxY: maxLimeY, w: maxLimeX - minLimeX, h: maxLimeY - minLimeY }
        });
      };
      img.src = imgSrc;
    });
  }, refPath);

  console.log('Reference Bounds Analysis:\n', JSON.stringify(bounds, null, 2));
  await browser.close();
}

measureRef().catch(console.error);
