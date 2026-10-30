import puppeteer from 'puppeteer-core';

async function captureModal() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.setViewport({ width: 1024, height: 768 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });

  // Click on "View Reward" button in the hero
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const viewRewardBtn = buttons.find(b => b.innerText && b.innerText.includes('View Reward'));
    if (viewRewardBtn) {
      viewRewardBtn.click();
    }
  });

  // Wait for modal animation
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: 'public/screenshots/reward-modal-white.png' });
  console.log('Saved screenshot to public/screenshots/reward-modal-white.png');

  await browser.close();
}

captureModal().catch(console.error);
