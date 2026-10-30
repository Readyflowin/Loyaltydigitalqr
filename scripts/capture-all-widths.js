import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function captureAll() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

  const outputDir = 'public/screenshots';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const targets = [
    { w: 1536, h: 960, file: 'public/screenshots/current-1536px.png' },
    { w: 1440, h: 900, file: 'public/screenshots/current-1440px.png' },
    { w: 1024, h: 682, file: 'public/screenshots/current-1024px.png' },
    { w: 768, h: 1024, file: 'public/screenshots/current-768px.png' },
    { w: 375, h: 667, file: 'public/screenshots/current-375px.png' },
  ];

  for (const t of targets) {
    await page.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 1 });
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.setItem('loyalty_theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await page.reload({ waitUntil: 'networkidle0' });

    // Capture measurement
    const metrics = await page.evaluate(() => {
      const heroContainer = document.querySelector('section > div');
      const r = heroContainer ? heroContainer.getBoundingClientRect() : null;
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      return {
        viewportW: docW,
        containerW: r ? Math.round(r.width) : 0,
        containerLeftGutter: r ? Math.round(r.left) : 0,
        containerRightGutter: r ? Math.round(docW - r.right) : 0,
        hasHorizontalOverflow: scrollW > docW,
      };
    });

    console.log(`Viewport ${t.w}x${t.h}:`, JSON.stringify(metrics));

    await page.screenshot({ path: t.file });
    console.log(`Saved screenshot to ${t.file}`);
  }

  await browser.close();
}

captureAll().catch(console.error);
