import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.setViewport({ width: 1024, height: 682, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('loyalty_theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await page.reload({ waitUntil: 'networkidle0' });

  const outputDir = 'public/screenshots';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = 'public/screenshots/current-1024x682.png';
  await page.screenshot({ path: outputPath });
  console.log('Screenshot saved to', outputPath);

  await browser.close();
}

capture().catch(console.error);
