import puppeteer from 'puppeteer';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkModals() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('loyalty_theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  // Click "Start Free Trial" button in header
  const startTrialBtn = await page.$('header button');
  if (startTrialBtn) {
    await startTrialBtn.click();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'dark-mode-card-builder-modal.png' });
    console.log('Saved dark-mode-card-builder-modal.png');
  }

  await browser.close();
}

checkModals().catch(console.error);
