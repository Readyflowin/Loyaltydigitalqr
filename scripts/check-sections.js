import puppeteer from 'puppeteer';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkSections() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 960, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('loyalty_theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Screenshot pricing
  const pricing = await page.$('#pricing');
  if (pricing) {
    await pricing.screenshot({ path: 'dark-mode-pricing.png' });
    console.log('Saved dark-mode-pricing.png');
  }

  // Screenshot FAQ
  const faq = await page.$('#faq');
  if (faq) {
    await faq.screenshot({ path: 'dark-mode-faq.png' });
    console.log('Saved dark-mode-faq.png');
  }

  // Screenshot footer
  const footer = await page.$('footer');
  if (footer) {
    await footer.screenshot({ path: 'dark-mode-footer.png' });
    console.log('Saved dark-mode-footer.png');
  }

  // Screenshot final CTA (section preceding footer)
  const sections = await page.$$('main > section');
  const finalCta = sections[sections.length - 1];
  if (finalCta) {
    await finalCta.screenshot({ path: 'dark-mode-final-cta.png' });
    console.log('Saved dark-mode-final-cta.png');
  }

  await browser.close();
}

checkSections().catch(console.error);
