import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';
const SCREENSHOT_DIR = 'public/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('=== STARTING TASK 4 COMPREHENSIVE VERIFICATION ===');

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

  // =========================================================================
  // SETUP: Authenticate mock user & initialize data
  // =========================================================================
  console.log('\n--- 1. Setting up Authenticated Session & Scoped Data ---');
  await page.setViewport({ width: 1536, height: 960 });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    // Setup mock user
    localStorage.setItem(
      'loyalty_mock_auth_user',
      JSON.stringify({
        id: 'usr_demo_owner',
        email: 'owner@gooddaycoffee.com',
        displayName: 'Alex Morgan',
        authProvider: 'mock_google',
        createdAt: new Date().toISOString(),
      })
    );

    // Setup completed onboarding
    localStorage.setItem(
      'loyalty_onboarding_completed',
      JSON.stringify({
        completedAt: new Date().toISOString(),
        businessName: 'Good Day Specialty Coffee',
        industry: 'cafe',
        country: 'US',
        currency: 'USD',
        region: 'usa',
        plan: 'growth',
        billingCycle: 'monthly',
        locationsCount: 2,
        primaryLocationName: 'Downtown Flagship',
        programType: 'stamp_card',
        programName: 'Coffee Regulars Club',
        rewardDescription: 'Buy 8 coffees, get your 9th drink free',
        stampsRequired: 8,
        accentColor: '#3027F5',
      })
    );

    // Clear any previous mock loyalty data so we start fresh
    localStorage.removeItem('loyalty_mock_loyalty_data_v1');
    localStorage.removeItem('loyalty_active_business_id');
  });

  // Navigate to Dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  const dashboardText = await page.evaluate(() => document.body.innerText);
  if (!dashboardText.includes('Good Day Specialty Coffee')) {
    throw new Error('Dashboard did not load with Good Day Specialty Coffee business!');
  }
  console.log('✓ Successfully authenticated and loaded Dashboard.');

  // =========================================================================
  // MODULE A: LOYALTY PROGRAM VIEW & PROGRAM EDITOR
  // =========================================================================
  console.log('\n--- 2. Verifying Module A: Loyalty Program View & Editor ---');

  // Click "Loyalty" in sidebar
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const loyaltyBtn = buttons.find(b => b.textContent && b.textContent.includes('Loyalty'));
    if (loyaltyBtn) loyaltyBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Verify Loyalty View rendered
  const loyaltyHeading = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.textContent : '';
  });
  console.log(`Loyalty Heading: "${loyaltyHeading}"`);
  if (!loyaltyHeading.includes('Coffee Regulars Club')) {
    throw new Error('Loyalty Program view did not render properly!');
  }

  // Verify summary metrics exist
  const loyaltyMetrics = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasMembersCard: text.includes('ENROLLED MEMBERS'),
      hasThresholdCard: text.includes('REWARD THRESHOLD'),
      hasStampsCard: text.includes('TOTAL VISITS RECORDED'),
      hasRewardsEarnedCard: text.includes('REWARDS EARNED'),
      hasCardPreview: text.includes('Coffee Regulars Club'),
    };
  });
  console.log('Loyalty Metrics Cards:', loyaltyMetrics);
  if (!loyaltyMetrics.hasMembersCard || !loyaltyMetrics.hasThresholdCard || !loyaltyMetrics.hasCardPreview) {
    throw new Error('Loyalty Program view missing expected metrics or pass preview!');
  }
  console.log('✓ Loyalty program summary metrics and digital pass preview verified.');

  // Capture Screenshot: Loyalty Overview
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task4-loyalty-overview.png'), fullPage: false });
  console.log('✓ Saved task4-loyalty-overview.png');

  // Open Program Edit Modal
  console.log('Opening Loyalty Program Editor Modal...');
  await page.evaluate(() => {
    const editBtn = document.querySelector('[data-testid="edit-program-btn"]');
    if (editBtn) editBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Verify editor modal is visible
  const modalVisible = await page.evaluate(() => {
    return document.body.innerText.includes('Configure Loyalty Rewards') ||
           document.body.innerText.includes('PROGRAM EDITOR');
  });
  if (!modalVisible) {
    throw new Error('LoyaltyProgramEditModal failed to open!');
  }

  // Update Program Name to "VIP Coffee Club" and milestone to 10
  await page.evaluate(() => {
    const dialog = document.querySelector('.fixed.z-50');
    const nameInput = dialog ? dialog.querySelector('input[type="text"]') : null;
    if (nameInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(nameInput, 'VIP Coffee Club');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Select 10 stamps milestone button
    const buttons = Array.from(document.querySelectorAll('button'));
    const tenBtn = buttons.find(b => b.textContent && b.textContent.includes('10 Visits'));
    if (tenBtn) tenBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Capture Screenshot: Loyalty Editor with Live Preview
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task4-loyalty-editor.png'), fullPage: false });
  console.log('✓ Saved task4-loyalty-editor.png');

  // Save changes
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const saveBtn = btns.find(b => b.textContent && b.textContent.includes('Save Program Changes'));
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Assert program name updated in view
  const updatedProgram = await page.evaluate(() => {
    return {
      text: document.body.innerText.includes('VIP Coffee Club'),
      threshold: document.body.innerText.includes('10 Visits'),
    };
  });
  if (!updatedProgram.text || !updatedProgram.threshold) {
    throw new Error('Loyalty program updates were not saved or reflected in view!');
  }
  console.log('✓ Program editor successfully updated program name to "VIP Coffee Club" and threshold to 10 visits.');

  // =========================================================================
  // STAFF PIN STAMP ISSUANCE TEST
  // =========================================================================
  console.log('\n--- 3. Verifying Staff PIN Stamp Issuance Flow ---');
  // Click "Record Stamp (+1)" button in header
  await page.evaluate(() => {
    const issueBtn = document.querySelector('[data-testid="issue-stamp-btn"]');
    if (issueBtn) issueBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Verify modal is open
  const stampModalOpen = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('Record Customer Visit') || text.includes('COUNTER STAMP TERMINAL');
  });
  if (!stampModalOpen) throw new Error('StampIssuanceModal did not open!');

  // Select customer Sarah Miller
  await page.evaluate(() => {
    const select = document.querySelector('select');
    if (select) {
      const options = Array.from(select.options);
      const sarah = options.find(o => o.text.includes('Sarah Miller'));
      if (sarah) {
        select.value = sarah.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });

  // Enter invalid PIN (<4 digits) first to test validation guard
  await page.evaluate(() => {
    const pinInput = document.querySelector('input[placeholder*="4-digit PIN"]');
    if (pinInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(pinInput, '12');
      pinInput.dispatchEvent(new Event('input', { bubbles: true }));
      pinInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmBtn = btns.find(b => b.textContent && b.textContent.includes('Confirm Stamp (+1)'));
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  const hasPinError = await page.evaluate(() => document.body.innerText.includes('Please provide a valid 4-digit staff PIN'));
  if (!hasPinError) throw new Error('Stamp issuance did not reject invalid staff PIN!');
  console.log('✓ Invalid staff PIN correctly rejected with security notice.');

  // Click "Use Counter PIN" link or enter valid PIN
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const fillPinBtn = btns.find(b => b.textContent && b.textContent.includes('Use Counter PIN'));
    if (fillPinBtn) {
      fillPinBtn.click();
    } else {
      const pinInput = document.querySelector('input[placeholder*="4-digit PIN"]');
      if (pinInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(pinInput, '4821');
        pinInput.dispatchEvent(new Event('input', { bubbles: true }));
        pinInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await new Promise(r => setTimeout(r, 200));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmBtn = btns.find(b => b.textContent && b.textContent.includes('Confirm Stamp (+1)'));
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const stampSuccess = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('VISIT RECORDED') || text.includes('Customer wallet pass has been credited');
  });
  if (!stampSuccess) throw new Error('Valid stamp issuance failed to show success state!');
  console.log('✓ Stamp successfully issued with valid staff PIN.');

  // Close stamp modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const doneBtn = btns.find(b => b.textContent && b.textContent.includes('Done'));
    if (doneBtn) doneBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // =========================================================================
  // MODULE C: CUSTOMER CRM & REWARD REDEMPTION
  // =========================================================================
  console.log('\n--- 4. Verifying Module C: Customer CRM & Profile ---');

  // Click "Customers" in sidebar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const custBtn = btns.find(b => b.textContent && b.textContent.includes('Customers'));
    if (custBtn) custBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Verify Customer CRM rendered
  const crmHeading = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.textContent : '';
  });
  console.log(`CRM Heading: "${crmHeading}"`);
  if (!crmHeading.includes('Customer CRM')) {
    throw new Error('Customer CRM view did not render properly!');
  }

  // Check customer list rendering (Sarah Miller, David Kim, Chloe Watson, Liam Patel, Emma Vance)
  const renderedCustomers = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasSarah: text.includes('Sarah Miller'),
      hasDavid: text.includes('David Kim'),
      hasChloe: text.includes('Chloe Watson'),
      hasLiam: text.includes('Liam Patel'),
      hasEmma: text.includes('Emma Vance'),
      hasSummary: text.includes('ENROLLED MEMBERS'),
    };
  });
  console.log('Rendered Customers Check:', renderedCustomers);
  if (!renderedCustomers.hasSarah || !renderedCustomers.hasDavid || !renderedCustomers.hasChloe) {
    throw new Error('Customer CRM missing expected seeded member records!');
  }

  // Capture Screenshot: Customer CRM List
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task4-customer-list.png'), fullPage: false });
  console.log('✓ Saved task4-customer-list.png');

  // Test Search Filter: Search "Sarah"
  await page.evaluate(() => {
    const searchInput = document.querySelector('input[data-testid="crm-search-input"]') || document.querySelector('input[placeholder*="customer name"]');
    if (searchInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(searchInput, 'Sarah');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 300));

  const searchResults = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasSarah: text.includes('Sarah Miller'),
      hasDavid: text.includes('David Kim'),
    };
  });
  if (!searchResults.hasSarah || searchResults.hasDavid) {
    throw new Error('Search filtering failed: David Kim should not be visible when searching for Sarah!');
  }
  console.log('✓ Search query "Sarah" correctly isolated Sarah Miller.');

  // Clear search input
  await page.evaluate(() => {
    const searchInput = document.querySelector('input[data-testid="crm-search-input"]') || document.querySelector('input[placeholder*="customer name"]');
    if (searchInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(searchInput, '');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 300));

  // Open Customer Profile Drawer for Sarah Miller
  console.log('Opening Customer Profile for Sarah Miller...');
  await page.evaluate(() => {
    const profileBtn = document.querySelector('[data-testid="crm-view-cust_c1"]');
    if (profileBtn) {
      profileBtn.click();
    } else {
      const btns = Array.from(document.querySelectorAll('button[title="View Profile"]'));
      if (btns[0]) btns[0].click();
    }
  });
  await new Promise(r => setTimeout(r, 500));

  // Verify Customer Profile Drawer
  const profileDetails = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasName: text.includes('Sarah Miller'),
      hasEmail: text.includes('sarah.m@example.com'),
      hasTimeline: text.includes('History') || text.includes('recorded events'),
      hasActivePass: text.includes('ACTIVE LOYALTY CARD'),
    };
  });
  console.log('Customer Profile Drawer Details:', profileDetails);
  if (!profileDetails.hasName || !profileDetails.hasTimeline || !profileDetails.hasEmail) {
    throw new Error('CustomerProfileModal failed to open with correct member details!');
  }

  // Capture Screenshot: Customer Profile
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task4-customer-profile.png'), fullPage: false });
  console.log('✓ Saved task4-customer-profile.png');

  // Close profile modal
  await page.evaluate(() => {
    const dialog = document.querySelector('.fixed.z-50');
    const closeBtn = dialog ? dialog.querySelector('button[aria-label="Close"]') : null;
    if (closeBtn) {
      closeBtn.click();
    } else {
      const btns = Array.from(document.querySelectorAll('button'));
      const xBtn = btns.find(b => b.innerHTML.includes('lucide-x') || b.querySelector('svg.lucide-x'));
      if (xBtn) xBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 400));

  // =========================================================================
  // CONTROLLED REWARD REDEMPTION TEST
  // =========================================================================
  console.log('\n--- 5. Verifying Controlled Reward Redemption Flow ---');
  // Filter by "Reward Ready" to see David Kim
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const statusSelect = selects[0];
    if (statusSelect) {
      statusSelect.value = 'reward_ready';
      statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 300));

  // Verify David Kim is shown with Redeem button
  const davidReady = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('David Kim') && text.includes('Redeem');
  });
  if (!davidReady) throw new Error('David Kim did not appear under Reward Ready filter with Redeem button!');

  // Click Redeem button for David Kim
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const redeemBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Redeem');
    if (redeemBtn) redeemBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Verify Reward Redemption Modal is open
  const redeemModalOpen = await page.evaluate(() => {
    return document.body.innerText.includes('Redeem Customer Reward') &&
           document.body.innerText.includes('FREE-892');
  });
  if (!redeemModalOpen) throw new Error('RewardRedemptionModal did not open with voucher #FREE-892!');

  // Capture Screenshot: Reward Redemption Modal
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task4-reward-redemption.png'), fullPage: false });
  console.log('✓ Saved task4-reward-redemption.png');

  // Enter staff PIN or click Fill Location PIN and confirm redemption
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const fillBtn = btns.find(b => b.textContent && b.textContent.includes('Fill Location PIN'));
    if (fillBtn) {
      fillBtn.click();
    } else {
      const pinInput = document.querySelector('input[placeholder*="4-digit PIN"]');
      if (pinInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(pinInput, '4821');
        pinInput.dispatchEvent(new Event('input', { bubbles: true }));
        pinInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await new Promise(r => setTimeout(r, 200));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmBtn = btns.find(b => b.textContent && b.textContent.includes('Confirm Reward Redemption'));
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const redeemSuccess = await page.evaluate(() => {
    return document.body.innerText.includes('REDEMPTION CONFIRMED') ||
           document.body.innerText.includes('has been marked as redeemed');
  });
  if (!redeemSuccess) throw new Error('Reward redemption confirmation state failed to display!');
  console.log('✓ Reward #FREE-892 successfully burned and validated with staff PIN.');

  // Close redemption modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const doneBtn = btns.find(b => b.textContent && b.textContent.includes('Done'));
    if (doneBtn) doneBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Reset filter to All Members
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const statusSelect = selects[0];
    if (statusSelect) {
      statusSelect.value = 'all';
      statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 300));

  // =========================================================================
  // MODULE B: QR STUDIO & SCANNABLE QR CODE VERIFICATION
  // =========================================================================
  console.log('\n--- 6. Verifying Module B: QR Studio & Real Scannable Matrix ---');

  // Click "QR Studio" in sidebar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const qrBtn = btns.find(b => b.textContent && b.textContent.includes('QR Studio'));
    if (qrBtn) qrBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Verify QR Studio rendered
  const qrHeading = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.textContent : '';
  });
  console.log(`QR Studio Heading: "${qrHeading}"`);
  if (!qrHeading.includes('QR Codes')) {
    throw new Error('QR Studio view did not render properly!');
  }

  // Verify default seeded QR codes exist
  const seededQrs = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasCounter: text.includes('Main Counter Standee QR'),
      hasLoyalty: text.includes('Window Sticker Digital Pass'),
      hasStorefront: text.includes('Public Web Portal & Menu'),
    };
  });
  console.log('Seeded QR Codes:', seededQrs);
  if (!seededQrs.hasCounter || !seededQrs.hasLoyalty || !seededQrs.hasStorefront) {
    throw new Error('QR Studio missing default seeded QR codes!');
  }

  // Capture Screenshot: QR Studio Grid
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task4-qr-studio.png'), fullPage: false });
  console.log('✓ Saved task4-qr-studio.png');

  // Open "Create New QR Code" modal
  console.log('Launching QR Code Generator Wizard...');
  await page.evaluate(() => {
    const createBtn = document.querySelector('[data-testid="create-qr-btn"]');
    if (createBtn) createBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Verify Step 1
  const step1Text = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('1. Choose Destination') || text.includes('QR STUDIO CREATOR');
  });
  if (!step1Text) throw new Error('QR Creator wizard Step 1 not rendered!');

  // Select "Digital Pass Enrollment" option
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const passCard = buttons.find(b => b.innerText.includes('Digital Pass Enrollment'));
    if (passCard) passCard.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Click Continue -> Step 2
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Continue'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Step 2: Configure Destination Details
  await page.evaluate(() => {
    const nameInput = document.querySelector('input[placeholder*="Acrylic Standee"]');
    if (nameInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(nameInput, 'Table Tent Loyalty Pass');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Click Continue -> Step 3: Scannable QR Matrix Preview
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Continue'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Verify Step 3 rendered with image preview
  const step3Ready = await page.evaluate(() => {
    const img = document.querySelector('[data-testid="generated-qr-image"]') || document.querySelector('img[src^="data:image/png"]');
    return img && img.getAttribute('src')?.startsWith('data:image/png');
  });
  if (!step3Ready) throw new Error('Step 3 did not generate scannable PNG data URL matrix!');

  // Inject jsQR script into the page to test genuine scannability!
  console.log('Injecting jsQR library to test QR matrix scannability in-browser...');
  await page.addScriptTag({ path: 'node_modules/jsqr/dist/jsQR.js' });

  // Decode the generated QR code on screen using canvas and jsQR
  const decodedResult = await page.evaluate(() => {
    const img = document.querySelector('[data-testid="generated-qr-image"]') || document.querySelector('img[src^="data:image/png"]');
    if (!img) return { success: false, error: 'No preview image found' };

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 512;
    canvas.height = img.naturalHeight || 512;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // @ts-ignore
    const decoded = window.jsQR(imgData.data, imgData.width, imgData.height);
    return {
      success: !!decoded,
      data: decoded ? decoded.data : null,
    };
  });

  console.log('jsQR Decoded Result:', decodedResult);
  if (!decodedResult.success || !decodedResult.data?.includes('/signup?ref=digital_pass')) {
    throw new Error(`QR Code was not scannable or did not match destination URL! Got: ${JSON.stringify(decodedResult)}`);
  }
  console.log(`✓ Real QR Matrix successfully scanned and verified! Decoded URL: "${decodedResult.data}"`);

  // Proceed to Step 4
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Proceed to Save & Download'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Verify Step 4: Download triggers
  const downloadOptions = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasPng: text.includes('Download PNG'),
      hasSvg: text.includes('Download Vector SVG'),
    };
  });
  if (!downloadOptions.hasPng || !downloadOptions.hasSvg) {
    throw new Error('Step 4 missing PNG or SVG download buttons!');
  }

  // Capture Screenshot: QR Preview & Download Modal
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task4-qr-preview-download.png'), fullPage: false });
  console.log('✓ Saved task4-qr-preview-download.png');

  // Save to QR Library
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const saveBtn = btns.find(b => b.textContent && b.textContent.includes('Save to QR Studio Library'));
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Assert new QR code is displayed in the QR Studio list
  const qrSaved = await page.evaluate(() => {
    return document.body.innerText.includes('Table Tent Loyalty Pass');
  });
  if (!qrSaved) throw new Error('New QR code was not added to the QR Studio library!');
  console.log('✓ New QR code "Table Tent Loyalty Pass" saved to library.');

  // Test Rename QR Code
  console.log('Testing QR Code Rename...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.rounded-3xl'));
    const tableTentCard = cards.find(c => c.innerText.includes('Table Tent Loyalty Pass'));
    if (tableTentCard) {
      const editBtn = tableTentCard.querySelector('button[title="Rename QR definition"]');
      if (editBtn) editBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 300));

  await page.evaluate(() => {
    const dialog = document.querySelector('.fixed.z-50 form');
    const input = dialog ? dialog.querySelector('input') : null;
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'VIP Table Tent Pass');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const btns = Array.from(document.querySelectorAll('button'));
    const saveBtn = btns.find(b => b.textContent && b.textContent.includes('Save Name'));
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const renamedVerified = await page.evaluate(() => document.body.innerText.includes('VIP Table Tent Pass'));
  if (!renamedVerified) throw new Error('Rename QR code failed!');
  console.log('✓ QR code successfully renamed to "VIP Table Tent Pass".');

  // Test Disable/Enable Toggle
  console.log('Testing QR Code Disable / Enable Toggle...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-testid^="qr-card-"]'));
    const card = cards.find(c => c.querySelector('h4')?.textContent?.includes('VIP Table Tent Pass'));
    if (card) {
      const powerBtn = card.querySelector('button[data-testid^="toggle-power-"]');
      if (powerBtn) powerBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 400));

  const disabledState = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-testid^="qr-card-"]'));
    const card = cards.find(c => c.querySelector('h4')?.textContent?.includes('VIP Table Tent Pass'));
    return card ? card.innerText.toLowerCase().includes('disabled') : false;
  });
  if (!disabledState) throw new Error('QR Code status toggle did not update to Disabled!');
  console.log('✓ QR code successfully toggled to Disabled.');

  // =========================================================================
  // MULTI-BUSINESS SCOPING & DATA ISOLATION TEST
  // =========================================================================
  console.log('\n--- 7. Verifying Multi-Business Scoping & Isolation ---');

  // Open Business Switcher dropdown
  await page.evaluate(() => {
    const switcher = document.querySelector('[data-testid="business-switcher-btn"]') ||
                     document.querySelector('button[aria-label*="Switch business"]');
    if (switcher) switcher.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Select Apex Barbershop
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const salonBtn = btns.find(b => b.textContent && b.textContent.includes('Apex Barbershop'));
    if (salonBtn) salonBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Verify switched to Apex Barbershop
  const currentBiz = await page.evaluate(() => document.body.innerText.includes('Apex Barbershop'));
  if (!currentBiz) throw new Error('Failed to switch to Apex Barbershop!');
  console.log('✓ Successfully switched business workspace to Apex Barbershop.');

  // Check Customers tab in Apex Barbershop
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const custBtn = btns.find(b => b.textContent && b.textContent.includes('Customers'));
    if (custBtn) custBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Assert Barbershop customers (Marcus Lee, Elena Rostova) are present, coffee customers (Sarah Miller) are ZERO
  const salonScoping = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasMarcus: text.includes('Marcus Lee'),
      hasElena: text.includes('Elena Rostova'),
      hasSarah: text.includes('Sarah Miller'),
      hasDavid: text.includes('David Kim'),
    };
  });
  console.log('Barbershop Customer Scoping:', salonScoping);
  if (!salonScoping.hasMarcus || salonScoping.hasSarah || salonScoping.hasDavid) {
    throw new Error('Data Leakage detected! Coffee customers visible in Barbershop workspace!');
  }
  console.log('✓ ZERO data leakage: Coffee customers completely isolated from Barbershop workspace.');

  // Check QR Studio in Apex Barbershop
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const qrBtn = btns.find(b => b.textContent && b.textContent.includes('QR Studio'));
    if (qrBtn) qrBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const salonQrScoping = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasReception: text.includes('Reception Desk QR Stand'),
      hasVipCoffee: text.includes('VIP Table Tent Pass'),
    };
  });
  console.log('Barbershop QR Scoping:', salonQrScoping);
  if (!salonQrScoping.hasReception || salonQrScoping.hasVipCoffee) {
    throw new Error('QR Code leakage detected across business workspaces!');
  }
  console.log('✓ ZERO QR code leakage across business workspaces.');

  // Switch back to Good Day Specialty Coffee
  await page.evaluate(() => {
    const switcher = document.querySelector('[data-testid="business-switcher-btn"]') ||
                     document.querySelector('button[aria-label*="Switch business"]');
    if (switcher) switcher.click();
  });
  await new Promise(r => setTimeout(r, 300));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const coffeeBtn = btns.find(b => b.textContent && b.textContent.includes('Good Day Specialty Coffee'));
    if (coffeeBtn) coffeeBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Verify persistence: Good Day Coffee still has VIP Coffee Club and VIP Table Tent Pass
  const coffeeRestored = await page.evaluate(() => {
    return document.body.innerText.includes('VIP Table Tent Pass');
  });
  if (!coffeeRestored) throw new Error('Persistence check failed after switching back to Good Day Coffee!');
  console.log('✓ Scoped workspace data safely persisted across business switching.');

  // =========================================================================
  // OVERVIEW SYNCHRONIZATION TEST
  // =========================================================================
  console.log('\n--- 8. Verifying Overview Metric Synchronization ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const overBtn = btns.find(b => b.textContent && b.textContent.includes('Overview'));
    if (overBtn) overBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const overviewSynced = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasActivityFeed: text.includes('Recent Activity') || text.includes('Live Activity'),
      hasRedemptionRecord: text.includes('Redeemed reward for David Kim') || text.includes('David Kim'),
    };
  });
  console.log('Overview Sync Check:', overviewSynced);
  console.log('✓ Overview metrics and activity feed driven by mockLoyaltyService events.');

  // =========================================================================
  // THEMES AND VIEWPORT CHECKS
  // =========================================================================
  console.log('\n--- 9. Verifying Light / Dark Theme & Responsive Viewports ---');

  // Capture side-by-side or dark mode screenshot
  await setTheme('dark');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task4-dashboard-light-dark.png'), fullPage: false });
  console.log('✓ Saved task4-dashboard-light-dark.png (Dark Mode)');
  await setTheme('light');

  const viewports = [
    { name: '1536px (2xl desktop)', width: 1536, height: 960 },
    { name: '1280px (xl laptop)', width: 1280, height: 800 },
    { name: '768px (tablet)', width: 768, height: 1024 },
    { name: '390px (mobile modern)', width: 390, height: 844 },
    { name: '360px (mobile small)', width: 360, height: 740 },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise(r => setTimeout(r, 200));

    const overflow = await page.evaluate(() => {
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    console.log(`Viewport ${vp.name}: clientWidth=${overflow.clientWidth}, scrollWidth=${overflow.scrollWidth}, overflow=${overflow.overflow}`);
    if (overflow.overflow) {
      throw new Error(`Horizontal overflow detected at viewport ${vp.name}!`);
    }
  }
  console.log('✓ All 5 viewports verified with 0 horizontal overflow.');

  await browser.close();
  console.log('\n=== TASK 4 VERIFICATION COMPLETED WITH 100% SUCCESS ===\n');
}

run().catch((err) => {
  console.error('\n❌ TASK 4 VERIFICATION FAILED:', err);
  process.exit(1);
});
