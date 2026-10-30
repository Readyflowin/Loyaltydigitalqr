import puppeteer from 'puppeteer-core';

async function inspectLayout() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 682, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });

  const tree = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll('header, main > section:first-child *').forEach(el => {
      if (['H1', 'P', 'HEADER', 'BUTTON', 'A', 'SECTION', 'DIV'].includes(el.tagName) && el.innerText?.slice(0, 25)) {
        const r = el.getBoundingClientRect();
        list.push({ tag: el.tagName, text: el.innerText.slice(0, 30).replace(/\n/g, ' '), y: Math.round(r.y), h: Math.round(r.height), x: Math.round(r.x) });
      }
    });
    return list.slice(0, 15);
  });

  console.log('Layout tree:', JSON.stringify(tree, null, 2));
  await browser.close();
}

inspectLayout().catch(console.error);
