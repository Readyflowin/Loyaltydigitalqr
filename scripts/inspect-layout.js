import puppeteer from 'puppeteer-core';

async function inspectLayout() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.setViewport({ width: 1536, height: 960 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });

  const info = await page.evaluate(() => {
    function getBox(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        cls: el.className,
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        csWidth: cs.width,
        csHeight: cs.height,
        csTransform: cs.transform
      };
    }

    const grid = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-12');
    const cols = grid ? Array.from(grid.children) : [];
    const rightCol = cols[1];
    const rightChildren = rightCol ? Array.from(rightCol.querySelectorAll('*')).slice(0, 5) : [];

    return {
      rightCol: getBox(rightCol),
      children: rightChildren.map(getBox)
    };
  });

  console.log('Layout Details:\n', JSON.stringify(info, null, 2));
  await browser.close();
}

inspectLayout().catch(console.error);
