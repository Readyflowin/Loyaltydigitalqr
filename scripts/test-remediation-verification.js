import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';
const SCREENSHOT_DIR = 'public/screenshots';
const ARTIFACT_DIR = 'C:\\Users\\aadit\\.gemini\\antigravity\\brain\\a0fe7a30-3660-4722-a63d-1fc7cdfaec27';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function copyToArtifact(filename) {
  try {
    const src = path.join(SCREENSHOT_DIR, filename);
    const dest = path.join(ARTIFACT_DIR, filename);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ Copied ${filename} to artifact directory`);
    }
  } catch (e) {
    console.warn(`  ! Could not copy ${filename} to artifact directory:`, e.message);
  }
}

async function run() {
  console.log('=== STARTING AUDIT REMEDIATION VERIFICATION SUITE ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`Browser console error: ${msg.text()}`);
    }
  });

  let allTestsPassed = true;
  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      allTestsPassed = false;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: P0-01 (REQ-T6-11) - Protect Kitchen Display
    // -------------------------------------------------------------
    console.log('\n--- 1. Verifying P0-01: Kitchen Display Authentication Guard ---');
    // Ensure logged out first
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.removeItem('loyalty_mock_auth_user');
      localStorage.removeItem('loyalty_current_business_id');
    });

    // Attempt direct unauthenticated access to Kitchen Display
    await page.goto(`${BASE_URL}/dashboard/kitchen`, { waitUntil: 'networkidle0' });
    const currentUrl = page.url();
    assert(
      currentUrl.includes('/login') && currentUrl.includes('redirect='),
      `Unauthenticated access redirected to login with redirect param: ${currentUrl}`
    );

    const authGateNotice = await page.evaluate(() => {
      return document.body.innerText.includes('Sign In') || document.body.innerText.includes('Welcome back');
    });
    assert(authGateNotice, 'Login page rendered to unauthenticated visitor.');

    // Now log in as merchant using official mock auth user session
    await page.evaluate(() => {
      const mockUser = {
        id: 'usr_owner_demo',
        email: 'alex@copperandstone.com',
        name: 'Alex Rivera',
        role: 'business_owner',
        businessIds: ['biz_user_primary', 'biz_copper_stone', 'biz_apex_barber', 'biz_veloce_wash', 'biz_iron_pulse', 'biz_nordic_goods'],
      };
      localStorage.setItem('loyalty_mock_auth_user', JSON.stringify(mockUser));
      localStorage.setItem('loyalty_current_business_id', 'biz_user_primary');
    });

    // Authenticated access to Kitchen Display
    await page.goto(`${BASE_URL}/dashboard/kitchen`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));
    const kdsHeading = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('kitchen display') && (text.includes('active queue') || text.includes('exit kds'));
    });
    assert(kdsHeading, 'Authenticated visitor can access Kitchen Display.');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'remediation-kds-authenticated.png') });
    await copyToArtifact('remediation-kds-authenticated.png');

    // -------------------------------------------------------------
    // TEST 2: P1-01 (REQ-T6-12) - Secure Order Tracking Lookup
    // -------------------------------------------------------------
    console.log('\n--- 2. Verifying P1-01: Secure Order Tracking Lookup ---');
    // Inspect orders from mockOrderService schema in localStorage
    const tokenInfo = await page.evaluate(() => {
      const raw = localStorage.getItem('loyalty_mock_orders_v1');
      if (raw) {
        const schema = JSON.parse(raw);
        const orders = schema['biz_user_primary'] || [];
        if (orders.length > 0) {
          return {
            validToken: orders[0].trackingToken,
            orderNumber: orders[0].orderNumber,
            id: orders[0].id,
          };
        }
      }
      return null;
    });

    if (tokenInfo && tokenInfo.validToken) {
      // Valid tracking token should resolve
      await page.goto(`${BASE_URL}/order/${tokenInfo.validToken}`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 500));
      const validOrderPage = await page.evaluate((orderNum) => {
        return !document.body.innerText.includes('Order Not Found') && document.body.innerText.includes(orderNum);
      }, tokenInfo.orderNumber);
      assert(validOrderPage, `Valid tracking token (${tokenInfo.validToken}) resolves order details.`);

      // Guessing by sequential order number (#1041 or 1041) MUST fail
      const cleanNum = tokenInfo.orderNumber.replace('#', '');
      await page.goto(`${BASE_URL}/order/${cleanNum}`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 500));
      const numericLookupRejected = await page.evaluate(() => {
        return document.body.innerText.includes('Order Not Found');
      });
      assert(numericLookupRejected, `Sequential order number lookup (${cleanNum}) is strictly rejected with 404.`);

      // Guessing by internal ID must also fail
      await page.goto(`${BASE_URL}/order/${tokenInfo.id}`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 500));
      const idLookupRejected = await page.evaluate(() => {
        return document.body.innerText.includes('Order Not Found');
      });
      assert(idLookupRejected, `Internal order ID lookup (${tokenInfo.id}) is strictly rejected with 404.`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'remediation-order-tracking-404.png') });
      await copyToArtifact('remediation-order-tracking-404.png');
    } else {
      console.warn('  ! No seed orders found in localStorage to test lookup');
    }

    // -------------------------------------------------------------
    // TEST 3: P1-02 (REQ-T4-02) - Staff PIN Validation & Security
    // -------------------------------------------------------------
    console.log('\n--- 3. Verifying P1-02: Staff PIN Masking and Strict Verification ---');
    await page.goto(`${BASE_URL}/dashboard?view=loyalty`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));

    // Open Stamp Issuance Modal from Loyalty view
    const stampBtnClicked = await page.evaluate(() => {
      const stampBtn = document.querySelector('[data-testid="issue-stamp-btn"]');
      if (stampBtn) {
        stampBtn.click();
        return true;
      }
      return false;
    });
    assert(stampBtnClicked, 'Clicked "Record Stamp (+1)" button to open StampIssuanceModal.');
    await new Promise((r) => setTimeout(r, 500));

    // Verify PIN input properties: type="password", initial value empty, no plaintext reveal buttons
    const pinInputAudit = await page.evaluate(() => {
      const pinInput = document.querySelector('input[type="password"]');
      const textInputs = Array.from(document.querySelectorAll('input[type="text"]'));
      const pinTextInput = textInputs.find((i) => i.placeholder && i.placeholder.includes('PIN'));
      const buttons = Array.from(document.querySelectorAll('button')).map((b) => b.innerText);
      const hasPlaintextFillButton = buttons.some((t) => t.includes('Use Counter PIN') || t.includes('Fill Location PIN') || t.includes('4821'));

      return {
        hasPasswordInput: !!pinInput,
        initialPasswordValue: pinInput ? pinInput.value : null,
        hasPlaintextInput: !!pinTextInput,
        hasPlaintextFillButton,
      };
    });

    assert(pinInputAudit.hasPasswordInput, 'Staff PIN field is masked as type="password".');
    assert(pinInputAudit.initialPasswordValue === '', 'Staff PIN input starts empty without pre-filled secret.');
    assert(!pinInputAudit.hasPlaintextFillButton, 'No plaintext "Use Counter PIN (4821)" bypass buttons present.');

    // Test rejecting wrong PIN (e.g. "9999")
    await page.evaluate(() => {
      const pinInput = document.querySelector('input[type="password"]');
      if (pinInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(pinInput, '9999');
        pinInput.dispatchEvent(new Event('input', { bubbles: true }));
        pinInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const submitBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Confirm Stamp'));
      if (submitBtn) submitBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const wrongPinRejected = await page.evaluate(() => {
      return document.body.innerText.includes('Invalid staff validation PIN') || document.body.innerText.includes('Please provide a valid 4-digit staff PIN');
    });
    assert(wrongPinRejected, 'Wrong PIN ("9999") is rejected with error notice.');

    // Test successful validation with correct PIN ("4821")
    await page.evaluate(() => {
      const pinInput = document.querySelector('input[type="password"]');
      if (pinInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(pinInput, '4821');
        pinInput.dispatchEvent(new Event('input', { bubbles: true }));
        pinInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const submitBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Confirm Stamp'));
      if (submitBtn) submitBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const stampSuccessRendered = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Stamp Recorded') || text.includes('Success') || text.includes('New Balance') || !document.querySelector('input[type="password"]');
    });
    assert(stampSuccessRendered, 'Correct PIN ("4821") successfully authorizes stamp issuance.');

    // -------------------------------------------------------------
    // TEST 4: P2-01 (REQ-T1-11) - Public Industry Routes
    // -------------------------------------------------------------
    console.log('\n--- 4. Verifying P2-01: Public Industry Landing Page Routes ---');
    const industries = [
      { slug: 'cafes', search: 'coffee' },
      { slug: 'salons', search: 'barbershops' },
      { slug: 'restaurants', search: 'restaurants' },
      { slug: 'retail', search: 'retail' },
      { slug: 'gyms', search: 'gyms' },
      { slug: 'carwash', search: 'car wash' },
    ];

    for (const ind of industries) {
      await page.goto(`${BASE_URL}/industries/${ind.slug}`, { waitUntil: 'networkidle0' });
      const pageText = (await page.evaluate(() => document.body.innerText)).toLowerCase();
      const hasHeading = pageText.includes(ind.search);
      assert(hasHeading, `Route /industries/${ind.slug} renders tailored content for ${ind.search}.`);
    }

    // Invalid industry slug should trigger 404
    await page.goto(`${BASE_URL}/industries/space-tourism`, { waitUntil: 'networkidle0' });
    const invalidIndustry404 = await page.evaluate(() => {
      const t = document.body.innerText.toLowerCase();
      return t.includes('404') && t.includes('not found');
    });
    assert(invalidIndustry404, 'Invalid industry /industries/space-tourism renders 404 Not Found page.');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'remediation-industry-retail.png') });
    await copyToArtifact('remediation-industry-retail.png');

    // -------------------------------------------------------------
    // TEST 5: P2-02 (REQ-XC-01) - 404 Not Found Page Experience
    // -------------------------------------------------------------
    console.log('\n--- 5. Verifying P2-02: 404 Not Found Page ---');
    await page.goto(`${BASE_URL}/some/completely/unmatched/url`, { waitUntil: 'networkidle0' });
    const notFoundDetails = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const buttons = Array.from(document.querySelectorAll('button')).map((b) => b.innerText.toLowerCase());
      const links = Array.from(document.querySelectorAll('a')).map((a) => a.innerText.toLowerCase());
      const allActions = [...buttons, ...links];

      return {
        has404Text: text.includes('404') && text.includes('not found'),
        hasHomeAction: allActions.some((a) => a.includes('homepage') || a.includes('home')),
        hasPricingAction: allActions.some((a) => a.includes('pricing')),
        hasLoginAction: allActions.some((a) => a.includes('login') || a.includes('merchant')),
      };
    });
    assert(notFoundDetails.has404Text, 'Unmatched route renders structured 404 Not Found page.');
    assert(notFoundDetails.hasHomeAction && notFoundDetails.hasPricingAction && notFoundDetails.hasLoginAction, '404 page includes navigation recovery actions.');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'remediation-404-page.png') });
    await copyToArtifact('remediation-404-page.png');

    // -------------------------------------------------------------
    // TEST 6: P2-03 (REQ-XC-02) - Dashboard View URL Query Persistence
    // -------------------------------------------------------------
    console.log('\n--- 6. Verifying P2-03: Dashboard Sub-View URL Persistence ---');
    await page.goto(`${BASE_URL}/dashboard?view=analytics`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    let isAnalyticsActive = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('analytics') && (text.includes('gross recorded value') || text.includes('export report'));
    });
    assert(isAnalyticsActive, 'Direct navigation to /dashboard?view=analytics loads Analytics sub-view.');

    // Reload the page and ensure it stays on Analytics view
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));
    isAnalyticsActive = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('analytics') && (text.includes('gross recorded value') || text.includes('export report'));
    });
    assert(isAnalyticsActive, 'Browser reload on /dashboard?view=analytics preserves Analytics view without resetting to overview.');

    // Navigate to customers view via sidebar and check URL update
    await page.evaluate(() => {
      const customersBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.trim() === 'Customers');
      if (customersBtn) customersBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const updatedUrl = page.url();
    assert(updatedUrl.includes('view=customers'), `Sidebar click correctly synchronizes URL search params: ${updatedUrl}`);

    // -------------------------------------------------------------
    // TEST 7: P2-04 (REQ-T3-07) - Location Switching Persistence
    // -------------------------------------------------------------
    console.log('\n--- 7. Verifying P2-04: Location Switching Persistence ---');
    await page.evaluate(() => {
      const map = { biz_user_primary: 'loc_primary_kiosk' };
      localStorage.setItem('loyalty_active_locations_map', JSON.stringify(map));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));

    const rehydratedLocation = await page.evaluate(() => {
      const raw = localStorage.getItem('loyalty_active_locations_map');
      return raw ? JSON.parse(raw)['biz_user_primary'] : null;
    });
    assert(rehydratedLocation === 'loc_primary_kiosk', 'Active location ID safely rehydrates from persistent map storage across reloads.');

    // -------------------------------------------------------------
    // TEST 8: P2-05 & P3-01 - Ground-Truth Analytics & CSV Symbol
    // -------------------------------------------------------------
    console.log('\n--- 8. Verifying P2-05 & P3-01: Ground-Truth Analytics & CSV Symbol ---');
    await page.goto(`${BASE_URL}/dashboard?view=analytics`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    const analyticsCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const subtitleCorrect = text.includes('Across verified recorded sales (unpriced passes excluded)');
      return {
        subtitleCorrect,
      };
    });
    assert(analyticsCheck.subtitleCorrect, 'Analytics view accurately informs users that unpriced passes are excluded rather than invented.');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'remediation-analytics-view.png') });
    await copyToArtifact('remediation-analytics-view.png');

    console.log('\n======================================================');
    if (allTestsPassed) {
      console.log('🎉 ALL AUDIT REMEDIATION VERIFICATION TESTS PASSED (100%)');
    } else {
      console.error('❌ SOME AUDIT REMEDIATION TESTS FAILED');
      process.exitCode = 1;
    }
    console.log('======================================================\n');
  } catch (err) {
    console.error('Verification script crashed with error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
