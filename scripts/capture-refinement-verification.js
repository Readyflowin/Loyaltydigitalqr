import puppeteer from 'puppeteer';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // --- 1. DARK MODE DESKTOP (1536px) ---
  const pageDark = await browser.newPage();
  await pageDark.setViewport({ width: 1536, height: 960, deviceScaleFactor: 2 });
  await pageDark.evaluateOnNewDocument(() => {
    localStorage.setItem('loyalty_theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await pageDark.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await pageDark.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  await pageDark.screenshot({ path: 'refinement-dark-hero.png' });
  console.log('Saved refinement-dark-hero.png');

  // Master wallet feature story section (3 feature cards)
  const masterStoryDark = await pageDark.$('#master-wallet');
  if (masterStoryDark) {
    await masterStoryDark.screenshot({ path: 'refinement-dark-feature-story.png' });
    console.log('Saved refinement-dark-feature-story.png');
  }

  // --- 2. LIGHT MODE DESKTOP (1536px & 1024px) ---
  const pageLight = await browser.newPage();
  await pageLight.setViewport({ width: 1536, height: 960, deviceScaleFactor: 2 });
  await pageLight.evaluateOnNewDocument(() => {
    localStorage.setItem('loyalty_theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await pageLight.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await pageLight.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  await pageLight.screenshot({ path: 'refinement-light-hero-1536.png' });
  console.log('Saved refinement-light-hero-1536.png');

  await pageLight.setViewport({ width: 1024, height: 682, deviceScaleFactor: 2 });
  await pageLight.screenshot({ path: 'refinement-light-hero-1024.png' });
  console.log('Saved refinement-light-hero-1024.png');

  const masterStoryLight = await pageLight.$('#master-wallet');
  if (masterStoryLight) {
    await masterStoryLight.screenshot({ path: 'refinement-light-feature-story.png' });
    console.log('Saved refinement-light-feature-story.png');
  }

  // --- 3. MOBILE VIEWPORT (390px) ---
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await pageMobile.evaluateOnNewDocument(() => {
    localStorage.setItem('loyalty_theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await pageMobile.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await pageMobile.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  await pageMobile.screenshot({ path: 'refinement-dark-mobile.png' });
  console.log('Saved refinement-dark-mobile.png');

  await browser.close();
}

run().catch(console.error);
