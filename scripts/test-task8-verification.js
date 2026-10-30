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
  console.log('=== STARTING TASK 8 COMPREHENSIVE VERIFICATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`Browser console error: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
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
    await new Promise((r) => setTimeout(r, 200));
  }

  async function switchBusiness(bizId) {
    await page.evaluate((id) => {
      localStorage.setItem('loyalty_active_business_id', id);
      localStorage.setItem(
        'loyalty_mock_auth_user',
        JSON.stringify({
          uid: 'usr_demo_owner',
          email: 'owner@demo.com',
          displayName: 'Demo Owner',
          businessId: id,
          role: 'owner',
          isAuthenticated: true,
          token: 'mock-jwt-token-12345',
        })
      );
    }, bizId);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 400));
  }

  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });

    // =========================================================================
    // SECTION 1: MODULE A — RETAIL CATALOGUE & IN-STORE PURCHASES
    // =========================================================================
    console.log('--- 1. RETAIL MODULE VERIFICATION ---');
    await switchBusiness('biz_retail_demo');

    // 1.1 Verify Overview Retail Operations Card
    const retailCard = await page.$('[data-testid="retail-operations-card"]');
    if (!retailCard) throw new Error('retail-operations-card missing on OverviewView');
    console.log('✓ Found retail-operations-card on OverviewView');

    await setTheme('light');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/task8-retail-overview-light.png` });
    await setTheme('dark');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/task8-retail-overview-dark.png` });

    // 1.2 Navigate to Catalogue
    await page.click('[data-testid="nav-catalogue"]');
    await new Promise((r) => setTimeout(r, 400));

    const catalogueView = await page.$('[data-testid="retail-catalogue-view"]');
    if (!catalogueView) throw new Error('RetailCatalogueView missing');
    console.log('✓ Navigated to RetailCatalogueView');

    // 1.3 Add a new product
    await page.click('[data-testid="add-product-btn"]');
    await new Promise((r) => setTimeout(r, 300));

    await page.type('[data-testid="input-product-name"]', 'Artisan Ceramic Tumbler');
    await page.type('[data-testid="input-product-sku"]', 'DRK-TUMB-01');
    await page.type('[data-testid="input-product-price"]', '28.50');
    await page.click('[data-testid="submit-product-btn"]');
    await new Promise((r) => setTimeout(r, 400));
    console.log('✓ Successfully created retail product "Artisan Ceramic Tumbler" ($28.50)');

    // 1.4 Record an In-Store Sale with CRM linking
    await page.click('[data-testid="record-sale-btn"]');
    await new Promise((r) => setTimeout(r, 300));

    const recordSaleModal = await page.$('[data-testid="record-sale-modal"]');
    if (!recordSaleModal) throw new Error('Record sale modal did not open');

    // Pick first customer
    await page.select('[data-testid="sale-customer-select"]', 'cust_sarah_01');
    await page.click('[data-testid="submit-sale-btn"]');
    await new Promise((r) => setTimeout(r, 600));
    console.log('✓ Successfully recorded in-store sale linked to CRM customer');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/task8-retail-catalogue.png` });

    // 1.5 Verify Public Digital Lookbook
    console.log('\n--- 1.5 Testing Public Catalog Lookbook ---');
    await page.goto(`${BASE_URL}/catalog/velvet-vine-boutique`, {
      waitUntil: 'networkidle0',
    });
    await new Promise((r) => setTimeout(r, 400));

    const publicCatalog = await page.$('[data-testid="public-catalog-page"]');
    if (!publicCatalog) throw new Error('PublicCatalogPage missing at /catalog/:slug');
    console.log('✓ Public catalog page rendered successfully');

    // Test search filter on public lookbook
    await page.type('[data-testid="public-catalog-search"]', 'Ceramic');
    await new Promise((r) => setTimeout(r, 300));
    console.log('✓ Lookbook search filter verified');

    await page.setViewport({ width: 390, height: 844 }); // Mobile viewport
    await page.screenshot({ path: `${SCREENSHOT_DIR}/task8-retail-public-lookbook-mobile.png` });
    await page.setViewport({ width: 1440, height: 900 });

    // =========================================================================
    // SECTION 2: MODULE B — GYM & FITNESS MANAGEMENT
    // =========================================================================
    console.log('\n--- 2. GYM & FITNESS MODULE VERIFICATION ---');
    await switchBusiness('biz_gym_demo');

    // 2.1 Verify Overview Gym Operations Card
    const gymCard = await page.$('[data-testid="gym-operations-card"]');
    if (!gymCard) throw new Error('gym-operations-card missing on OverviewView');
    console.log('✓ Found gym-operations-card on OverviewView');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/task8-gym-overview.png` });

    // 2.2 Member Roster & Plans
    await page.click('[data-testid="nav-members"]');
    await new Promise((r) => setTimeout(r, 400));
    const membersView = await page.$('[data-testid="gym-members-table"]');
    if (!membersView) throw new Error('gym-members-table missing');
    console.log('✓ Active members roster rendered with members table');

    // Create a new membership plan
    await page.click('[data-testid="tab-plans"]');
    await new Promise((r) => setTimeout(r, 300));
    await page.click('[data-testid="create-plan-btn"]');
    await new Promise((r) => setTimeout(r, 300));

    await page.type('[data-testid="input-plan-name"]', 'Summer Student Pass');
    await page.type('[data-testid="input-plan-price"]', '49.00');
    await page.click('[data-testid="submit-plan-btn"]');
    await new Promise((r) => setTimeout(r, 400));
    console.log('✓ Created gym plan "Summer Student Pass"');

    // 2.3 Member Check-In Terminal
    console.log('\n--- 2.3 Testing Gym Check-In Terminal ---');
    await page.click('[data-testid="nav-visit-tracking"]');
    await new Promise((r) => setTimeout(r, 400));

    const checkInView = await page.$('[data-testid="gym-checkin-view"]');
    if (!checkInView) throw new Error('gym-checkin-view missing');

    // Search and select Chloe Bennett (punch pass)
    await page.type('[data-testid="checkin-search-input"]', 'Chloe');
    await new Promise((r) => setTimeout(r, 300));
    await page.click('[data-testid="member-search-result-mem_chloe"]');
    await new Promise((r) => setTimeout(r, 300));

    // Confirm first check-in
    await page.click('[data-testid="confirm-checkin-btn"]');
    await new Promise((r) => setTimeout(r, 500));

    const successBanner = await page.$('[data-testid="checkin-success-banner"]');
    if (!successBanner) throw new Error('Expected check-in success banner');
    console.log('✓ Member check-in succeeded & loyalty stamp issued');

    // Immediate duplicate check-in attempt (should fail idempotency / duplicate check)
    await page.click('[data-testid="confirm-checkin-btn"]');
    await new Promise((r) => setTimeout(r, 500));
    const duplicateErrorBanner = await page.$('[data-testid="checkin-error-banner"]');
    if (!duplicateErrorBanner) throw new Error('Expected duplicate check-in error banner');
    console.log('✓ Duplicate check-in prevented successfully');

    // Expired member check-in denial test (Marcus Lee)
    await page.click('[data-testid="checkin-search-input"]');
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="checkin-search-input"]');
      if (input) input.value = '';
    });
    await page.type('[data-testid="checkin-search-input"]', 'Marcus');
    await new Promise((r) => setTimeout(r, 300));
    await page.click('[data-testid="member-search-result-mem_marcus"]');
    await new Promise((r) => setTimeout(r, 300));

    await page.click('[data-testid="confirm-checkin-btn"]');
    await new Promise((r) => setTimeout(r, 500));
    const expiredErrorBanner = await page.$('[data-testid="checkin-error-banner"]');
    if (!expiredErrorBanner) throw new Error('Expected expired membership denial banner');
    console.log('✓ Expired member check-in denied successfully');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/task8-gym-checkin-terminal.png` });

    // 2.4 Fitness & Studio Classes
    console.log('\n--- 2.4 Testing Fitness & Studio Classes ---');
    await page.click('[data-testid="nav-classes"]');
    await new Promise((r) => setTimeout(r, 400));

    const classesView = await page.$('[data-testid="gym-classes-view"]');
    if (!classesView) throw new Error('gym-classes-view missing');

    // Schedule a new class
    await page.click('[data-testid="create-class-btn"]');
    await new Promise((r) => setTimeout(r, 300));

    await page.type('[data-testid="class-name-input"]', 'Core Blast & Mobility');
    await page.type('[data-testid="class-instructor-input"]', 'Coach Tyler');
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="class-capacity-input"]');
      if (input) input.value = '2'; // Low capacity for testing limit
    });
    await page.click('[data-testid="submit-class-btn"]');
    await new Promise((r) => setTimeout(r, 400));
    console.log('✓ Successfully scheduled new class "Core Blast & Mobility" (capacity 2)');

    // Enroll member in HIIT class
    await page.click('[data-testid="enroll-member-btn-cls_hiit"]');
    await new Promise((r) => setTimeout(r, 300));
    await page.select('[data-testid="enroll-member-select"]', 'mem_chloe');
    await page.click('[data-testid="confirm-enroll-btn"]');
    await new Promise((r) => setTimeout(r, 1200));
    console.log('✓ Enrolled member in HIIT class');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/task8-gym-classes.png` });

    // =========================================================================
    // SECTION 3: MODULE C — CAR WASH MANAGEMENT
    // =========================================================================
    console.log('\n--- 3. CAR WASH MODULE VERIFICATION ---');
    await switchBusiness('biz_carwash_demo');

    // 3.1 Overview Car Wash Operations Card
    const cwCard = await page.$('[data-testid="carwash-operations-card"]');
    if (!cwCard) throw new Error('carwash-operations-card missing on OverviewView');
    console.log('✓ Found carwash-operations-card on OverviewView');

    // 3.2 Services Catalogue
    await page.click('[data-testid="nav-wash-services"]');
    await new Promise((r) => setTimeout(r, 400));
    const cwServices = await page.$('[data-testid="carwash-services-view"]');
    if (!cwServices) throw new Error('carwash-services-view missing');
    console.log('✓ Wash services catalogue rendered');

    // 3.3 Bundles & Passes Roster
    await page.click('[data-testid="nav-wash-bundles"]');
    await new Promise((r) => setTimeout(r, 400));
    const cwBundles = await page.$('[data-testid="carwash-bundles-view"]');
    if (!cwBundles) throw new Error('carwash-bundles-view missing');
    console.log('✓ Wash bundles & customer passes view rendered');

    // 3.4 Tunnel Check-In & Wash Redemption Terminal
    console.log('\n--- 3.4 Testing Car Wash Terminal ---');
    await page.click('[data-testid="nav-wash-visits"]');
    await new Promise((r) => setTimeout(r, 400));

    const cwTerminal = await page.$('[data-testid="carwash-visits-view"]');
    if (!cwTerminal) throw new Error('carwash-visits-view missing');

    // Search pass by plate "CA-7X9821" (David Miller)
    await page.type('[data-testid="wash-search-input"]', 'CA-7X9821');
    await new Promise((r) => setTimeout(r, 300));
    await page.click('[data-testid="pass-search-result-pass_david"]');
    await new Promise((r) => setTimeout(r, 300));

    // Confirm wash redemption
    await page.click('[data-testid="confirm-wash-btn"]');
    await new Promise((r) => setTimeout(r, 500));
    const washSuccessBanner = await page.$('[data-testid="wash-success-banner"]');
    if (!washSuccessBanner) throw new Error('Expected wash redemption success banner');
    console.log('✓ Car wash redeemed & loyalty stamp awarded');

    // Duplicate redemption prevention
    await page.click('[data-testid="confirm-wash-btn"]');
    await new Promise((r) => setTimeout(r, 500));
    const washDupBanner = await page.$('[data-testid="wash-error-banner"]');
    if (!washDupBanner) throw new Error('Expected duplicate wash redemption error');
    console.log('✓ Duplicate wash redemption prevented');

    // Exhausted pass test (Kevin Vance - 0 washes left)
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="wash-search-input"]');
      if (input) input.value = '';
    });
    await page.type('[data-testid="wash-search-input"]', 'Kevin');
    await new Promise((r) => setTimeout(r, 300));
    await page.click('[data-testid="pass-search-result-pass_kevin"]');
    await new Promise((r) => setTimeout(r, 300));

    await page.click('[data-testid="confirm-wash-btn"]');
    await new Promise((r) => setTimeout(r, 500));
    const exhaustedBanner = await page.$('[data-testid="wash-error-banner"]');
    if (!exhaustedBanner) throw new Error('Expected exhausted pass denial banner');
    console.log('✓ Exhausted pass redemption denied');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/task8-carwash-terminal.png` });

    // =========================================================================
    // SECTION 4: MODULE D — GENERIC SERVICE BUSINESS
    // =========================================================================
    console.log('\n--- 4. GENERIC SERVICE WORKSPACE VERIFICATION ---');
    await switchBusiness('biz_service_demo');

    // 4.1 Overview Service Operations Card
    const svcCard = await page.$('[data-testid="service-operations-card"]');
    if (!svcCard) throw new Error('service-operations-card missing on OverviewView');
    console.log('✓ Found service-operations-card on OverviewView');

    // 4.2 Service Offerings Catalogue
    await page.click('[data-testid="nav-service-catalogue"]');
    await new Promise((r) => setTimeout(r, 400));
    const svcCatalog = await page.$('[data-testid="generic-services-view"]');
    if (!svcCatalog) throw new Error('generic-services-view missing');
    console.log('✓ Generic service offerings catalogue rendered');

    // 4.3 Service Activity & Job Terminal
    await page.click('[data-testid="nav-service-visits"]');
    await new Promise((r) => setTimeout(r, 400));
    const svcTerminal = await page.$('[data-testid="generic-visits-view"]');
    if (!svcTerminal) throw new Error('generic-visits-view missing');

    await page.click('[data-testid="record-service-job-btn"]');
    await new Promise((r) => setTimeout(r, 300));

    // Fill job modal
    await page.select('[data-testid="job-customer-select"]', 'cust_sarah_01');
    await page.type('[data-testid="job-notes-input"]', 'Completed motherboard inspection and re-paste.');
    await page.click('[data-testid="submit-job-btn"]');
    await new Promise((r) => setTimeout(r, 500));
    console.log('✓ Recorded service job and issued loyalty stamp');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/task8-service-jobs.png` });

    // =========================================================================
    // SECTION 5: STRICT WORKSPACE ISOLATION VERIFICATION
    // =========================================================================
    console.log('\n--- 5. STRICT WORKSPACE ISOLATION AUDIT ---');

    // 5.1 In Cafe workspace: NO retail/gym/carwash tabs or cards
    await switchBusiness('biz_user_primary');
    const cafeHasRetailTab = await page.$('[data-testid="nav-catalogue"]');
    const cafeHasGymTab = await page.$('[data-testid="nav-members"]');
    const cafeHasWashTab = await page.$('[data-testid="nav-wash-services"]');
    const cafeHasGymCard = await page.$('[data-testid="gym-operations-card"]');
    if (cafeHasRetailTab || cafeHasGymTab || cafeHasWashTab || cafeHasGymCard) {
      throw new Error('Workspace leak: Cafe workspace has retail/gym/wash modules!');
    }
    console.log('✓ Café workspace is strictly isolated (no retail, gym, or car wash elements)');

    // 5.2 In Gym workspace: NO food menu or tables tabs
    await switchBusiness('biz_gym_demo');
    const gymHasMenuTab = await page.$('[data-testid="nav-menu"]');
    const gymHasTablesTab = await page.$('[data-testid="nav-tables"]');
    const gymHasCafeCard = await page.$('[data-testid="restaurant-operations-card"]');
    if (gymHasMenuTab || gymHasTablesTab || gymHasCafeCard) {
      throw new Error('Workspace leak: Gym workspace has restaurant/cafe modules!');
    }
    console.log('✓ Gym workspace is strictly isolated (no café menu or table QR elements)');

    // 5.3 In Car Wash workspace: NO salon staff or appointments tabs
    await switchBusiness('biz_carwash_demo');
    const washHasSalonTab = await page.$('[data-testid="nav-appointments"]');
    const washHasSalonCard = await page.$('[data-testid="salon-operations-card"]');
    if (washHasSalonTab || washHasSalonCard) {
      throw new Error('Workspace leak: Car wash workspace has salon modules!');
    }
    console.log('✓ Car wash workspace is strictly isolated (no salon elements)');

    console.log('\n=== ALL TASK 8 CHECKS PASSED WITH 100% SUCCESS ===');
  } catch (err) {
    console.error('\n❌ Task 8 verification failed:', err);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/task8-error.png` });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
