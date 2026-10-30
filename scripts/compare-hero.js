import puppeteer from 'puppeteer-core';

async function compareHero() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 682, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('loyalty_theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await page.reload({ waitUntil: 'networkidle0' });

  const data = await page.evaluate(() => {
    function getBox(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }

    const allH3 = Array.from(document.querySelectorAll('h3'));
    const gooddayH3 = allH3.find(h => h.innerText.includes('Collect 8 visits'));
    const gooddayCard = gooddayH3 ? gooddayH3.closest('.rounded-\\[26px\\]') : null;

    const allDivs = Array.from(document.querySelectorAll('div'));
    const qrDiv = allDivs.find(d => d.innerText && d.innerText.includes('SCAN. JOIN.') && d.classList.contains('bg-white'));
    const toastDiv = allDivs.find(d => d.innerText && d.innerText.includes('Reward Unlocked!') && d.classList.contains('bg-white'));
    const limePanel = document.querySelector('.bg-\\[\\#D6FF38\\]');
    const strip = document.querySelector('.border-t.border-\\[\\#E0DED6\\]');

    return {
      header: getBox(document.querySelector('header')),
      eyebrow: getBox(Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('LOYALTY, WITHOUT'))?.parentElement),
      headline: getBox(document.querySelector('h1')),
      gooddayCard: getBox(gooddayCard),
      qrCard: getBox(qrDiv),
      toast: getBox(toastDiv),
      limePanel: getBox(limePanel),
      strip: getBox(strip),
    };
  });

  console.log('Hero Detailed Bounds:\n', JSON.stringify(data, null, 2));
  await browser.close();
}

compareHero().catch(console.error);
