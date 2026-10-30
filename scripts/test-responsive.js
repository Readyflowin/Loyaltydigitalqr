import puppeteer from 'puppeteer-core';

async function testResponsive() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

  const viewports = [
    { width: 1440, height: 900, name: '1440x900' },
    { width: 768, height: 1024, name: '768x1024' },
    { width: 375, height: 667, name: '375x667' }
  ];

  for (const vp of viewports) {
    await page.setViewport(vp);
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`Viewport ${vp.name}: horizontal overflow = ${hasHorizontalScroll}`);
  }

  await browser.close();
}

testResponsive().catch(console.error);
