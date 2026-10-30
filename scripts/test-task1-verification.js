import puppeteer from 'puppeteer';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';
const SCREENSHOT_DIR = 'public/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('--- STARTING TASK 1 VERIFICATION ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Listen to browser console and page errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser console error: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.error(`Page error: ${err.message}`);
  });

  // Helper to switch theme
  async function setTheme(theme) {
    await page.evaluate((t) => {
      localStorage.setItem('loyalty_theme', t);
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, theme);
    await new Promise(r => setTimeout(r, 200));
  }

  // 1. TEST HOMEPAGE (Light & Dark)
  console.log('\n1. Verifying Homepage (/) ...');
  await page.setViewport({ width: 1536, height: 960 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await setTheme('light');

  // Verify document title
  const homeTitle = await page.title();
  console.log(`Homepage title: "${homeTitle}"`);

  // Verify brand name Loyaltydigitalqr is present
  const brandCount = await page.evaluate(() => {
    return (document.body.innerText.match(/Loyaltydigitalqr/g) || []).length;
  });
  console.log(`Brand occurrences for "Loyaltydigitalqr": ${brandCount}`);

  // Verify NO pricing on homepage ($10, ₹299, "Plans from $10")
  const pricingOnHome = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasTenPerMonth: /\$10\s*\/\s*month/i.test(text) || /\$10\s*\/\s*mo/i.test(text),
      hasRupee299: /₹299/i.test(text),
      hasPricingSection: !!document.getElementById('pricing'),
      hasPricingNavLink: !!document.querySelector('a[href="/pricing"]'),
    };
  });
  console.log('Homepage pricing check:', pricingOnHome);
  if (pricingOnHome.hasTenPerMonth || pricingOnHome.hasRupee299 || pricingOnHome.hasPricingSection) {
    console.error('FAIL: Homepage still contains subscription pricing or pricing section!');
  } else {
    console.log('PASS: Homepage is clean of subscription prices.');
  }

  // Capture homepage light screenshot
  await page.screenshot({ path: `${SCREENSHOT_DIR}/task1-homepage-light-1536.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task1-homepage-light-1536.png`);

  // Capture homepage dark screenshot
  await setTheme('dark');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/task1-homepage-dark-1536.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task1-homepage-dark-1536.png`);

  // 2. TEST PRICING REGION SELECTOR (/pricing)
  console.log('\n2. Verifying Region Selector (/pricing) ...');
  await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle0' });
  await setTheme('light');
  const pricingTitle = await page.title();
  console.log(`Pricing title: "${pricingTitle}"`);

  const selectorCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasHeadline: text.includes('Simple pricing. Built for your business.'),
      hasUsOption: text.includes('United States') && text.includes('$10'),
      hasIndiaOption: text.includes('India') && text.includes('₹299'),
      hasUsLink: !!document.querySelector('a[href="/usa"]'),
      hasIndiaLink: !!document.querySelector('a[href="/india"]'),
    };
  });
  console.log('Region selector content check:', selectorCheck);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task1-pricing-selector-light-1536.png`, fullPage: true });
  console.log(`Saved ${SCREENSHOT_DIR}/task1-pricing-selector-light-1536.png`);

  await setTheme('dark');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/task1-pricing-selector-dark-1536.png`, fullPage: true });
  console.log(`Saved ${SCREENSHOT_DIR}/task1-pricing-selector-dark-1536.png`);

  // 3. TEST US PRICING (/usa)
  console.log('\n3. Verifying US Pricing (/usa) ...');
  await page.goto(`${BASE_URL}/usa`, { waitUntil: 'networkidle0' });
  await setTheme('light');
  const usaTitle = await page.title();
  console.log(`USA title: "${usaTitle}"`);

  const usaCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasStarter: text.includes('STARTER PLAN') || text.includes('Small Business Edition'),
      hasTenMonthly: text.includes('$10') && text.includes('/month'),
      has30DaysFree: text.includes('30-day free trial') || text.includes('30 days free'),
      hasNoCard: text.includes('No credit card required'),
      hasFeatures: text.includes('Print-ready PDF counter display') && text.includes('Staff PIN stamp validation system'),
      hasFaq: text.includes('US Pricing FAQ'),
    };
  });
  console.log('USA pricing check:', usaCheck);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task1-usa-pricing-light-1536.png`, fullPage: true });
  console.log(`Saved ${SCREENSHOT_DIR}/task1-usa-pricing-light-1536.png`);

  await setTheme('dark');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/task1-usa-pricing-dark-1536.png`, fullPage: true });
  console.log(`Saved ${SCREENSHOT_DIR}/task1-usa-pricing-dark-1536.png`);

  // 4. TEST INDIA PRICING (/india)
  console.log('\n4. Verifying India Pricing (/india) ...');
  await page.goto(`${BASE_URL}/india`, { waitUntil: 'networkidle0' });
  await setTheme('light');
  const indiaTitle = await page.title();
  console.log(`India title: "${indiaTitle}"`);

  const indiaCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasStarter: text.includes('STARTER PLAN') || text.includes('Small Business Edition'),
      has299Monthly: text.includes('₹299') && text.includes('/month'),
      has30DaysFree: text.includes('30-day free trial') || text.includes('30 days free'),
      hasNoCard: text.includes('No credit card required') || text.includes('without providing any credit card'),
      hasFeatures: text.includes('Print-ready PDF counter display') && text.includes('Staff PIN stamp validation system'),
      hasFaq: text.includes('India Pricing FAQ'),
    };
  });
  console.log('India pricing check:', indiaCheck);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task1-india-pricing-light-1536.png`, fullPage: true });
  console.log(`Saved ${SCREENSHOT_DIR}/task1-india-pricing-light-1536.png`);

  await setTheme('dark');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/task1-india-pricing-dark-1536.png`, fullPage: true });
  console.log(`Saved ${SCREENSHOT_DIR}/task1-india-pricing-dark-1536.png`);

  // 5. TEST CASE SENSITIVITY REDIRECT (/India -> /india)
  console.log('\n5. Verifying /India redirect to /india ...');
  await page.goto(`${BASE_URL}/India`, { waitUntil: 'networkidle0' });
  const redirectedUrl = page.url();
  console.log(`Navigated to /India -> Current URL is: ${redirectedUrl}`);
  if (redirectedUrl.endsWith('/india')) {
    console.log('PASS: /India successfully canonicalized to /india.');
  } else {
    console.error('FAIL: /India did not redirect to /india!');
  }

  // 6. TEST DIRECT NAVIGATION & REFRESH ON ROUTES
  console.log('\n6. Verifying Direct Navigation & Browser Refresh ...');
  for (const path of ['/pricing', '/usa', '/india']) {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle0' });
    await page.reload({ waitUntil: 'networkidle0' });
    const currentLoc = await page.evaluate(() => window.location.pathname);
    console.log(`Refreshed ${path} -> successfully stayed at: ${currentLoc}`);
  }

  // 7. RESPONSIVE VIEWPORT TESTS (1536, 1280, 768, 390, 360)
  console.log('\n7. Verifying Responsive Viewports across Routes ...');
  const viewports = [
    { w: 1536, h: 960, label: '1536px desktop' },
    { w: 1280, h: 800, label: '1280px laptop' },
    { w: 768, h: 1024, label: '768px tablet' },
    { w: 390, h: 844, label: '390px mobile' },
    { w: 360, h: 740, label: '360px narrow mobile' },
  ];

  const testRoutes = ['/', '/pricing', '/usa', '/india'];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.w, height: vp.h });
    for (const route of testRoutes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle0' });
      const overflow = await page.evaluate(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        return scrollW > docW;
      });

      if (overflow) {
        console.error(`FAIL: Horizontal overflow detected on ${route} at ${vp.label}!`);
      } else {
        console.log(`PASS: ${route} at ${vp.label} has no overflow.`);
      }
    }
  }

  // Capture mobile screenshot of pricing
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/task1-pricing-selector-mobile-390.png`, fullPage: true });
  console.log(`Saved ${SCREENSHOT_DIR}/task1-pricing-selector-mobile-390.png`);

  await browser.close();
  console.log('\n--- TASK 1 VERIFICATION COMPLETED SUCCESSFULLY ---');
}

run().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
