import puppeteer from 'puppeteer';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verify() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Capture Dark Mode at 1536x960
  await page.setViewport({ width: 1536, height: 960, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('loyalty_theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: 'dark-mode-hero-1536.png' });
  console.log('Saved dark-mode-hero-1536.png');

  // Inspect dark mode computed colors
  const darkMetrics = await page.evaluate(() => {
    const headline = document.querySelector('h1');
    const headlineSpans = headline ? Array.from(headline.querySelectorAll('span')) : [];
    const p = document.querySelector('section p');
    const primaryBtn = document.querySelector('section button');
    const _navLink = document.querySelector('nav a, header a');
    const underline = document.querySelector('h1 svg path');
    const _unfilledStamp = document.querySelector('.stamp-unfilled, [aria-label*="Stamp"]');

    return {
      headlineColor: headline ? window.getComputedStyle(headline).color : null,
      headlineSpanColors: headlineSpans.map(s => ({
        text: s.textContent.trim(),
        color: window.getComputedStyle(s).color
      })),
      pColor: p ? window.getComputedStyle(p).color : null,
      primaryBtnBg: primaryBtn ? window.getComputedStyle(primaryBtn).backgroundColor : null,
      primaryBtnColor: primaryBtn ? window.getComputedStyle(primaryBtn).color : null,
      underlineStroke: underline ? window.getComputedStyle(underline).stroke : null,
    };
  });
  console.log('Dark mode metrics:', JSON.stringify(darkMetrics, null, 2));

  // Full page dark mode
  await page.screenshot({ path: 'dark-mode-fullpage-1536.png', fullPage: true });
  console.log('Saved dark-mode-fullpage-1536.png');

  // 2. Capture Dark Mode at 1024x768
  await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2 });
  await page.screenshot({ path: 'dark-mode-hero-1024.png' });
  console.log('Saved dark-mode-hero-1024.png');

  // 3. Capture Light Mode to verify light mode remains completely intact
  await page.evaluate(() => {
    localStorage.setItem('loyalty_theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  await page.setViewport({ width: 1536, height: 960, deviceScaleFactor: 2 });
  await page.screenshot({ path: 'light-mode-hero-1536.png' });
  console.log('Saved light-mode-hero-1536.png');

  await page.setViewport({ width: 1024, height: 682, deviceScaleFactor: 2 });
  await page.screenshot({ path: 'light-mode-hero-1024.png' });
  console.log('Saved light-mode-hero-1024.png');

  await browser.close();
}

verify().catch(console.error);
