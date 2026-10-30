import puppeteer from 'puppeteer';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkLight() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 960, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('loyalty_theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: 'light-mode-hero-1536.png' });
  console.log('Saved true light-mode-hero-1536.png');

  await browser.close();
}

checkLight().catch(console.error);
