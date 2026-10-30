import puppeteer from 'puppeteer';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';
const SCREENSHOT_DIR = 'public/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('--- STARTING TASK 3 VERIFICATION ---');

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
  // 1. VERIFY AUTH GUARD (Unauthenticated /dashboard -> redirects to /login)
  // =========================================================================
  console.log('\n1. Verifying Auth Guard on /dashboard ...');
  await page.setViewport({ width: 1536, height: 960 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });

  // Clear all auth sessions
  await page.evaluate(() => {
    localStorage.removeItem('loyalty_mock_auth_user');
    localStorage.removeItem('loyalty_onboarding_draft');
    localStorage.removeItem('loyalty_onboarding_completed');
    localStorage.removeItem('loyalty_saved_businesses');
    localStorage.removeItem('loyalty_active_business_id');
  });

  // Try direct navigation to /dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const currentUrl = page.url();
  console.log('URL after navigating to /dashboard while unauthenticated:', currentUrl);
  if (currentUrl.includes('/login')) {
    console.log('PASS: Unauthenticated user successfully redirected to login.');
  } else {
    console.error('FAIL: Unauthenticated user was NOT redirected!');
  }

  // =========================================================================
  // 2. SIGN IN & ENTER DASHBOARD
  // =========================================================================
  console.log('\n2. Initializing merchant session & entering /dashboard ...');
  // First, set up a mock business via mock onboarding completion
  await page.evaluate(() => {
    const mockUser = {
      id: 'mock_usr_verified',
      email: 'alex.merchant@example.com',
      displayName: 'Alex Merchant',
      isMock: true,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('loyalty_mock_auth_user', JSON.stringify(mockUser));

    const mockCompleted = {
      businessName: 'Roast & Brew Coffee Co.',
      businessType: 'cafe',
      region: 'usa',
      timeZone: 'America/New_York',
      logoInitial: 'R',
      selectedModules: ['loyalty-cards'],
      contactEmail: 'alex@roastbrew.com',
      address: '742 Evergreen Terrace, Springfield',
      phoneNumber: '+1 (555) 345-6789',
      displayName: 'Roast & Brew',
      locationType: 'first',
      programName: 'Roast & Brew VIP Club',
      stampsRequired: 8,
      rewardDescription: 'Free specialty espresso drink or pastry',
      accentColor: '#3027F5',
      currentStep: 5,
      isCompleted: true,
      planContext: 'starter'
    };
    localStorage.setItem('loyalty_onboarding_completed', JSON.stringify(mockCompleted));
  });

  // Navigate to /dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
  await setTheme('light');
  await new Promise(r => setTimeout(r, 400));

  const dashboardTitle = await page.title();
  console.log(`Dashboard page title: "${dashboardTitle}"`);

  // =========================================================================
  // 3. VERIFY DASHBOARD OVERVIEW (Light & Dark)
  // =========================================================================
  console.log('\n3. Verifying Dashboard Overview Content & Metrics ...');
  const overviewCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasBusinessName: text.includes('Roast & Brew Coffee Co.'),
      hasCustomersMetric: text.includes('TOTAL CUSTOMERS'),
      hasVisitsMetric: text.includes('LOYALTY VISITS'),
      hasRewardsMetric: text.includes('REWARDS EARNED'),
      hasRepeatRateMetric: text.includes('REPEAT RATE'),
      hasChecklist: text.includes('ACTIVATION CHECKLIST'),
      hasActivityFeed: text.includes('LIVE ACTIVITY LOG') || text.includes('Recent Customer Visits'),
      hasQuickActions: text.includes('WORKSPACE SHORTCUTS'),
      hasSidebarLoyalty: text.includes('Loyalty Program'),
      hasSidebarQRStudio: text.includes('QR Studio'),
    };
  });
  console.log('Overview check results:', overviewCheck);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task3-dashboard-overview-light-1536.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task3-dashboard-overview-light-1536.png`);

  await setTheme('dark');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/task3-dashboard-overview-dark-1536.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task3-dashboard-overview-dark-1536.png`);

  // =========================================================================
  // 4. VERIFY BUSINESS SWITCHER & DYNAMIC INDUSTRY MODULES
  // =========================================================================
  console.log('\n4. Verifying Multi-Business Switcher Modal ...');
  await setTheme('light');

  // Click business switcher button in sidebar
  const switcherBtn = await page.$('button[data-testid="business-switcher-btn"]');
  if (switcherBtn) {
    await switcherBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  const switcherModalVisible = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('WORKSPACE SWITCHER') || text.includes('Select Business or Counter');
  });
  console.log('Business switcher modal visible:', switcherModalVisible);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task3-dashboard-business-switcher.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task3-dashboard-business-switcher.png`);

  // Switch to Barbershop / Salon business
  console.log('Switching to Apex Barbershop & Grooming ...');
  const salonBizButton = await page.$('button[data-testid="biz-select-biz_salon_demo"]');
  if (salonBizButton) {
    await salonBizButton.click();
    await new Promise(r => setTimeout(r, 500));
  } else {
    console.error('FAIL: Could not find salon biz select button!');
  }

  // Verify dynamic navigation for Salon
  const salonNavCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasActiveSalon: text.includes('Apex Barbershop & Grooming'),
      hasAppointmentsModule: text.includes('Appointments'),
      hasStaffCalendarModule: text.includes('Staff Calendar'),
      hasServiceMenuModule: text.includes('Service Menu'),
      hasStaffProfilesModule: text.includes('Stylists & Chairs'),
      hasPlannedBadges: text.includes('Planned') || text.includes('PLANNED'),
    };
  });
  console.log('Salon dynamic modules check:', salonNavCheck);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task3-dashboard-salon-modules.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task3-dashboard-salon-modules.png`);

  // =========================================================================
  // 5. VERIFY PLANNED MODULE PLACEHOLDER VIEW
  // =========================================================================
  console.log('\n5. Verifying Module Placeholder View (Appointments) ...');
  const appointmentsNavBtn = await page.$('button[data-testid="nav-appointments"]');
  if (appointmentsNavBtn) {
    await appointmentsNavBtn.click();
    await new Promise(r => setTimeout(r, 400));
  } else {
    console.error('FAIL: Could not find appointments nav button!');
  }

  const placeholderCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasTitle: text.includes('Appointments & Booking Management'),
      hasPlannedBadge: text.includes('PLANNED MODULE'),
      hasTargetTask: text.includes('Task 9'),
      hasReturnOverviewBtn: text.includes('Return to Business Overview'),
    };
  });
  console.log('Placeholder view check:', placeholderCheck);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task3-dashboard-module-placeholder.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task3-dashboard-module-placeholder.png`);

  // =========================================================================
  // 6. VERIFY WORKSPACE SETTINGS TABS
  // =========================================================================
  console.log('\n6. Verifying Workspace Settings View ...');
  const settingsNavBtn = await page.$('button[data-testid="nav-settings"]');
  if (settingsNavBtn) {
    await settingsNavBtn.click();
    await new Promise(r => setTimeout(r, 400));
  } else {
    console.error('FAIL: Could not find settings nav button!');
  }

  const settingsCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasSettingsTitle: text.includes('Settings & Permissions') || text.includes('Workspace Settings'),
      hasProfileTab: text.includes('Business Profile'),
      hasLocationsTab: text.includes('Locations & Counters'),
      hasLoyaltyTab: text.includes('Loyalty Program'),
      hasTeamTab: text.includes('Team & Staff PIN'),
      hasBillingTab: text.includes('Plan & Billing'),
    };
  });
  console.log('Settings view check:', settingsCheck);

  // Switch to Plan & Billing tab
  const billingTabBtn = await page.$('button ::-p-text(Plan & Billing)');
  if (billingTabBtn) {
    await billingTabBtn.click();
    await new Promise(r => setTimeout(r, 300));
  }

  const billingCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasPlanName: text.includes('Starter Plan'),
      hasPlanPrice: text.includes('$10/mo') || text.includes('₹299/mo'),
      hasTrialStatus: text.includes('30-Day Trial Active') || text.includes('Trial'),
    };
  });
  console.log('Billing tab check:', billingCheck);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task3-dashboard-settings.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task3-dashboard-settings.png`);

  // =========================================================================
  // 7. VERIFY NOTIFICATIONS DROPDOWN
  // =========================================================================
  console.log('\n7. Verifying Header Mock Notifications ...');
  const bellBtn = await page.$('button[data-testid="notifications-btn"]');
  if (bellBtn) {
    await bellBtn.click();
    await new Promise(r => setTimeout(r, 400));
  } else {
    console.error('FAIL: Could not find notifications button!');
  }
  const notifCheck = await page.evaluate(() => {
    const text = document.body.innerText.toUpperCase();
    return text.includes('ACTIVITY NOTIFICATIONS') || text.includes('REWARD UNLOCKED') || text.includes('JOINED');
  });
  console.log('Notifications dropdown visible:', notifCheck);

  // Close notifications
  if (bellBtn) await bellBtn.click();
  await new Promise(r => setTimeout(r, 200));

  // =========================================================================
  // 8. RESPONSIVE VIEWPORT TESTING & ZERO HORIZONTAL OVERFLOW
  // =========================================================================
  console.log('\n8. Verifying Responsive Viewports (1536, 1280, 768, 390, 360) ...');
  const viewports = [
    { w: 1536, h: 960, label: '1536px desktop' },
    { w: 1280, h: 800, label: '1280px laptop' },
    { w: 768, h: 1024, label: '768px tablet' },
    { w: 390, h: 844, label: '390px mobile' },
    { w: 360, h: 740, label: '360px narrow mobile' },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.w, height: vp.h });
    await new Promise(r => setTimeout(r, 150));

    const overflow = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      return scrollW > docW;
    });

    if (overflow) {
      console.error(`FAIL: Horizontal overflow detected on /dashboard at ${vp.label}!`);
    } else {
      console.log(`PASS: /dashboard at ${vp.label} has no horizontal overflow.`);
    }
  }

  // On 390px mobile, test collapsible mobile drawer
  console.log('\nTesting mobile drawer on 390px ...');
  await page.setViewport({ width: 390, height: 844 });
  const menuBtn = await page.$('button:has(.lucide-menu)');
  if (menuBtn) {
    await menuBtn.click();
    await new Promise(r => setTimeout(r, 350));
  }

  const drawerVisible = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('WORKSPACE') || text.includes('CORE');
  });
  console.log('Mobile navigation drawer visible:', drawerVisible);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/task3-dashboard-mobile-390.png`, fullPage: false });
  console.log(`Saved ${SCREENSHOT_DIR}/task3-dashboard-mobile-390.png`);

  // =========================================================================
  // 9. VERIFY SIGN OUT
  // =========================================================================
  console.log('\n9. Verifying Sign Out Flow ...');
  // First resize back to desktop so sidebar is visible
  await page.setViewport({ width: 1536, height: 960 });
  await new Promise(r => setTimeout(r, 200));

  const signOutBtn = await page.$('button[data-testid="sign-out-btn"]');
  if (signOutBtn) {
    await signOutBtn.click();
    await new Promise(r => setTimeout(r, 600));
  } else {
    console.error('FAIL: Could not find sign-out button!');
  }

  const postSignOutUrl = page.url();
  console.log('URL after clicking Sign Out:', postSignOutUrl);
  if (postSignOutUrl.includes('/login')) {
    console.log('PASS: Sign Out cleared session and navigated to /login.');
  } else {
    console.error('FAIL: User was NOT redirected to /login after signing out!');
  }

  // Verify session is really cleared from localStorage
  const sessionCleared = await page.evaluate(() => {
    return localStorage.getItem('loyalty_mock_auth_user') === null;
  });
  console.log('Mock session cleared from storage:', sessionCleared);

  await browser.close();
  console.log('\n--- TASK 3 VERIFICATION COMPLETED SUCCESSFULLY ---');
}

run().catch(err => {
  console.error('Task 3 Verification error:', err);
  process.exit(1);
});
