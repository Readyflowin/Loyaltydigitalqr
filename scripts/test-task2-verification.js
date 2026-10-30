import puppeteer from 'puppeteer';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';
const SCREENSHOT_DIR = 'public/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('--- STARTING TASK 2 VERIFICATION ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser console error: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.error(`Page error: ${err.message}`);
  });

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

  // Clear demo storage before testing
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.removeItem('loyalty_mock_auth_user');
    localStorage.removeItem('loyalty_onboarding_draft');
    localStorage.removeItem('loyalty_onboarding_completed');
  });

  // 1. TEST LOGIN PAGE (/login)
  console.log('\n1. Verifying Login Page (/login) ...');
  await page.setViewport({ width: 1536, height: 960 });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await setTheme('light');

  const loginTitle = await page.title();
  console.log(`Login title: "${loginTitle}"`);

  const loginContent = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasWelcomeBack: text.includes('Welcome back'),
      hasGoogleDemo: text.includes('Continue with Google (Demo)'),
      hasDemoNotice: text.includes('Demo Environment') || text.includes('Task 10'),
      hasEmailForm: text.includes('Business Email') && text.includes('Password'),
      hasSignupLink: !!document.querySelector('a[href="/signup"]'),
    };
  });
  console.log('Login content check:', loginContent);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task2-login-light-1536.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task2-login-light-1536.png`);

  await setTheme('dark');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/task2-login-dark-1536.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task2-login-dark-1536.png`);

  // 2. TEST SIGNUP PAGE (/signup) & REGION CONTEXT
  console.log('\n2. Verifying Signup Page (/signup) with Region Context ...');
  // 2a. USA region
  await page.goto(`${BASE_URL}/signup?region=usa&plan=starter`, { waitUntil: 'networkidle0' });
  await setTheme('light');
  const usaSignupCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasHeadline: text.includes('Set up your business for repeat customers'),
      hasUsPlan: text.includes('United States') && text.includes('$10/month'),
      hasGoogleDemo: text.includes('Sign up with Google (Demo)'),
      hasLoginLink: !!document.querySelector('a[href="/login"]'),
    };
  });
  console.log('US Signup check:', usaSignupCheck);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task2-signup-usa-light-1536.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task2-signup-usa-light-1536.png`);

  // 2b. India region
  await page.goto(`${BASE_URL}/signup?region=india&plan=starter`, { waitUntil: 'networkidle0' });
  await setTheme('dark');
  const indiaSignupCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasIndiaPlan: text.includes('India') && text.includes('₹299/month'),
      hasGoogleDemo: text.includes('Sign up with Google (Demo)'),
    };
  });
  console.log('India Signup check:', indiaSignupCheck);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task2-signup-india-dark-1536.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task2-signup-india-dark-1536.png`);

  // 3. TEST ONBOARDING WIZARD (/onboarding)
  console.log('\n3. Verifying Onboarding Wizard (/onboarding) ...');
  await page.goto(`${BASE_URL}/onboarding?region=usa&plan=starter`, { waitUntil: 'networkidle0' });
  await setTheme('light');

  // Step 1: Business Basics
  console.log('Checking Step 1 validation...');
  // Click continue without business name
  const continueBtn = await page.$('button ::-p-text(Continue)');
  if (continueBtn) {
    await continueBtn.click();
    await new Promise(r => setTimeout(r, 200));
  }

  const step1Error = await page.evaluate(() => {
    return document.body.innerText.includes('Business name is required');
  });
  console.log('Step 1 validation error triggered correctly:', step1Error);

  // Fill business name
  await page.type('input[placeholder*="Good Day Espresso Bar"]', 'Roast & Brew Coffee Co.');
  await new Promise(r => setTimeout(r, 100));

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task2-onboarding-step1-light-1536.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task2-onboarding-step1-light-1536.png`);

  // Advance to Step 2
  const continueBtn2 = await page.$('button ::-p-text(Continue)');
  if (continueBtn2) await continueBtn2.click();
  await new Promise(r => setTimeout(r, 300));

  // Step 2: Modules
  console.log('Checking Step 2 (Modules)...');
  const step2Check = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasStep2: text.includes('Step 2 of 5'),
      hasDigitalLoyalty: text.includes('Digital Loyalty Cards'),
      hasAvailableBadge: text.includes('Available Now'),
      hasPlannedBadge: text.includes('Planned Module'),
    };
  });
  console.log('Step 2 check:', step2Check);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task2-onboarding-step2-light-1536.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task2-onboarding-step2-light-1536.png`);

  // Advance to Step 3
  const continueBtn3 = await page.$('button ::-p-text(Continue)');
  if (continueBtn3) await continueBtn3.click();
  await new Promise(r => setTimeout(r, 300));

  // Step 3: Business Details
  console.log('Checking Step 3 (Details)...');
  await page.type('input[placeholder*="manager@yourbusiness.com"]', 'hello@roastbrew.com');
  await page.type('input[placeholder*="142 Elm St"]', '452 Marketplace Way');
  await new Promise(r => setTimeout(r, 100));

  // Advance to Step 4
  const continueBtn4 = await page.$('button ::-p-text(Continue)');
  if (continueBtn4) await continueBtn4.click();
  await new Promise(r => setTimeout(r, 300));

  // Step 4: Loyalty Program & Live Preview
  console.log('Checking Step 4 (Loyalty Program & Preview)...');
  const step4Check = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasStep4: text.includes('Step 4 of 5'),
      hasPreview: text.includes('LIVE CUSTOMER PASS PREVIEW'),
      hasBizNameInPreview: text.includes('Roast & Brew Coffee Co.'),
      hasVisitsRequired: text.includes('Visits Required for Reward'),
    };
  });
  console.log('Step 4 check:', step4Check);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task2-onboarding-step4-light-1536.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task2-onboarding-step4-light-1536.png`);

  // Test Back Navigation (Preservation check)
  console.log('Testing Back navigation preservation...');
  const backBtn = await page.$('button ::-p-text(Back)');
  if (backBtn) await backBtn.click();
  await new Promise(r => setTimeout(r, 300));

  const preservedEmail = await page.evaluate(() => {
    const emailInput = document.querySelector('input[type="email"]');
    return emailInput ? emailInput.value : null;
  });
  console.log('Preserved contact email when navigating back to Step 3:', preservedEmail);
  if (preservedEmail === 'hello@roastbrew.com') {
    console.log('PASS: Form state preserved when navigating backwards.');
  } else {
    console.error('FAIL: Form state was not preserved!');
  }

  // Go forward again to Step 4 then Step 5
  const nextBtn3 = await page.$('button ::-p-text(Continue)');
  if (nextBtn3) await nextBtn3.click();
  await new Promise(r => setTimeout(r, 300));

  const nextBtn4 = await page.$('button ::-p-text(Continue)');
  if (nextBtn4) await nextBtn4.click();
  await new Promise(r => setTimeout(r, 300));

  // Step 5: Review
  console.log('Checking Step 5 (Review)...');
  const step5Check = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasStep5: text.includes('Step 5 of 5'),
      hasSummary: text.includes('CONFIGURATION SUMMARY'),
      hasBusinessName: text.includes('Roast & Brew Coffee Co.'),
      hasCompleteBtn: text.includes('Complete Setup & Launch Demo'),
    };
  });
  console.log('Step 5 check:', step5Check);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task2-onboarding-step5-light-1536.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task2-onboarding-step5-light-1536.png`);

  // Complete Onboarding
  console.log('Clicking Complete Setup & Launch Demo...');
  const completeBtn = await page.$('button ::-p-text(Complete Setup & Launch Demo)');
  if (completeBtn) await completeBtn.click();
  await new Promise(r => setTimeout(r, 500));

  // Verify Completion State
  const completionCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasCompletionHeadline: text.includes('Your business workspace is configured!'),
      hasDemoNotice: text.includes('DEMO ONBOARDING COMPLETE') && text.includes('Task 10'),
      hasResetBtn: text.includes('Reset & Test Another Business'),
      hasReturnHomeLink: !!document.querySelector('a[href="/"]'),
    };
  });
  console.log('Completion state check:', completionCheck);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task2-onboarding-complete-light-1536.png`, fullPage: true });
  console.log(`Saved ${SCREENSHOT_DIR}/task2-onboarding-complete-light-1536.png`);

  await setTheme('dark');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/task2-onboarding-complete-dark-1536.png`, fullPage: true });
  console.log(`Saved ${SCREENSHOT_DIR}/task2-onboarding-complete-dark-1536.png`);

  // 4. RESPONSIVE VIEWPORT TESTS (1536, 1280, 768, 390, 360)
  console.log('\n4. Verifying Responsive Viewports on Task 2 Routes ...');
  const viewports = [
    { w: 1536, h: 960, label: '1536px desktop' },
    { w: 1280, h: 800, label: '1280px laptop' },
    { w: 768, h: 1024, label: '768px tablet' },
    { w: 390, h: 844, label: '390px mobile' },
    { w: 360, h: 740, label: '360px narrow mobile' },
  ];

  const routes = ['/login', '/signup', '/onboarding'];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.w, height: vp.h });
    for (const route of routes) {
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

  // Capture mobile screenshot of onboarding
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/task2-onboarding-mobile-390.png`, fullPage: true });
  console.log(`Saved ${SCREENSHOT_DIR}/task2-onboarding-mobile-390.png`);

  await browser.close();
  console.log('\n--- TASK 2 VERIFICATION COMPLETED SUCCESSFULLY ---');
}

run().catch(err => {
  console.error('Task 2 Verification error:', err);
  process.exit(1);
});
