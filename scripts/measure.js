import puppeteer from 'puppeteer-core';

async function measure() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 682, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });

  const metrics = await page.evaluate(() => {
    function getBox(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }

    return {
      header: getBox(document.querySelector('header')),
      logo: getBox(document.querySelector('header a')),
      headline: getBox(document.querySelector('h1')),
      paragraph: getBox(document.querySelector('h1 + p') || document.querySelector('main p')),
      workflowStrip: getBox(document.querySelector('main .border-t')),
    };
  });

  console.log('DOM Measurements:\n', JSON.stringify(metrics, null, 2));
  await browser.close();
}

measure().catch(console.error);
