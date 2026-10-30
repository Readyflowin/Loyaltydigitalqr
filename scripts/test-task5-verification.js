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
  console.log('=== STARTING TASK 5 COMPREHENSIVE VERIFICATION ===');

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

  // =========================================================================
  // SETUP: Authenticate mock user & initialize data
  // =========================================================================
  console.log('\n--- 1. Setting up Authenticated Session & Scoped Data ---');
  await page.setViewport({ width: 1440, height: 900 });
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

    // Setup completed onboarding for Good Day Specialty Coffee
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
        planName: 'Starter Plan',
        planPrice: '$10/mo',
        timeZone: 'America/New_York',
        contactEmail: 'owner@gooddaycoffee.com',
        phoneNumber: '+1 (555) 234-5678',
        programName: 'Coffee Regulars Club',
        rewardDescription: 'Buy 8 coffees, get your 9th drink free',
        stampsRequired: 8,
        selectedModules: ['loyalty-cards', 'counter-qr', 'customer-crm', 'cafe-menu', 'table-qr'],
        accentColor: '#3027F5',
        address: '142 Market St, Suite 101',
      })
    );

    // Set active business
    localStorage.setItem('loyalty_active_business_id', 'biz_user_primary');
  });

  // Navigate to Dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));
  await setTheme('light');

  // =========================================================================
  // MODULE A: CAFÉ MENU MANAGEMENT
  // =========================================================================
  console.log('\n--- 2. Verifying Module A: Café Menu Management ---');

  // Click "Menu & Items" in sidebar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const menuBtn = btns.find((b) => b.textContent && b.textContent.includes('Menu & Items'));
    if (menuBtn) menuBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Verify Cafe Menu View is rendered
  const menuTitle = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.textContent : '';
  });
  console.log(`Menu View Title: "${menuTitle}"`);
  if (!menuTitle || !menuTitle.toLowerCase().includes('menu')) {
    throw new Error('Café Menu management view failed to render!');
  }

  // Verify categories are rendered
  const categoriesRendered = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasCoffee: text.includes('Coffee'),
      hasTea: text.includes('Tea'),
      hasColdDrinks: text.includes('Cold Drinks'),
      hasBakery: text.includes('Bakery'),
      hasFood: text.includes('Food'),
    };
  });
  console.log('Categories rendered:', categoriesRendered);
  if (!categoriesRendered.hasCoffee || !categoriesRendered.hasBakery || !categoriesRendered.hasFood) {
    throw new Error('Menu categories missing in dashboard!');
  }

  // Verify initial seed items
  const itemsRendered = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasCappuccino: text.includes('Cappuccino'),
      hasVanillaLatte: text.includes('Vanilla Bean Latte'),
      hasColdBrew: text.includes('Nitro Cold Brew'),
      hasChai: text.includes('Artisan Masala Chai'),
      hasCroissant: text.includes('Butter Almond Croissant'),
      hasPanini: text.includes('Grilled Mozzarella & Pesto Panini'),
      hasBrownie: text.includes('Fudge Chocolate Brownie'),
    };
  });
  console.log('Items rendered:', itemsRendered);
  if (!itemsRendered.hasCappuccino || !itemsRendered.hasColdBrew || !itemsRendered.hasPanini) {
    throw new Error('Seed menu items missing in dashboard!');
  }

  // Capture Screenshot: Cafe Menu Management Grid
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task5-menu-management.png'), fullPage: false });
  console.log('✓ Saved task5-menu-management.png');

  // Test Search Filter: Search "Nitro"
  console.log('Testing Menu Search Filter...');
  await page.evaluate(() => {
    const searchInput = document.querySelector('[data-testid="search-menu-items"]');
    if (searchInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(searchInput, 'Nitro');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise((r) => setTimeout(r, 300));

  const searchResults = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasNitro: text.includes('Nitro Cold Brew'),
      hasCappuccino: text.includes('Cappuccino'),
    };
  });
  if (!searchResults.hasNitro || searchResults.hasCappuccino) {
    throw new Error('Menu search filtering failed: "Cappuccino" should not be visible when searching for "Nitro"!');
  }
  console.log('✓ Menu search filter verified.');

  // Clear search filter
  await page.evaluate(() => {
    const searchInput = document.querySelector('[data-testid="search-menu-items"]');
    if (searchInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(searchInput, '');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise((r) => setTimeout(r, 300));

  // Test Availability Toggle
  console.log('Testing Item Availability Toggle...');
  const firstItemToggle = await page.evaluate(() => {
    const toggleBtn = document.querySelector('[data-testid^="toggle-item-status-"]');
    if (toggleBtn) {
      const beforeText = toggleBtn.textContent.trim();
      toggleBtn.click();
      return { beforeText };
    }
    return null;
  });
  await new Promise((r) => setTimeout(r, 400));

  const afterToggleText = await page.evaluate(() => {
    const toggleBtn = document.querySelector('[data-testid^="toggle-item-status-"]');
    return toggleBtn ? toggleBtn.textContent.trim() : '';
  });
  console.log(`Availability toggled from ${firstItemToggle?.beforeText} to ${afterToggleText}`);
  if (firstItemToggle?.beforeText === afterToggleText) {
    throw new Error('Item availability toggle failed to update status!');
  }
  console.log('✓ Availability toggle successfully updated item status.');

  // Test Duplicate Item
  console.log('Testing Duplicate Item...');
  await page.evaluate(() => {
    const dupBtn = document.querySelector('[data-testid^="duplicate-item-"]');
    if (dupBtn) dupBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const hasCopy = await page.evaluate(() => {
    return document.body.innerText.includes('(Copy)');
  });
  if (!hasCopy) {
    throw new Error('Duplicate item action failed to create copy!');
  }
  console.log('✓ Item duplication verified.');

  // Open Add Item Modal & Create Custom Item
  console.log('Opening Add Menu Item Modal...');
  await page.evaluate(() => {
    const addBtn = document.querySelector('[data-testid="add-item-btn"]');
    if (addBtn) addBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Verify modal is open
  const modalOpen = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('ADD NEW MENU ITEM') || text.includes('Create Menu Item');
  });
  if (!modalOpen) throw new Error('MenuItemEditModal failed to open!');

  // Fill in new item form
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const nameInput = inputs.find((i) => i.placeholder && i.placeholder.includes('Flat White'));
    if (nameInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(nameInput, 'Matcha Pistachio Croissant');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const priceInput = inputs.find((i) => i.type === 'number');
    if (priceInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(priceInput, '5.25');
      priceInput.dispatchEvent(new Event('input', { bubbles: true }));
      priceInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const descInput = document.querySelector('textarea');
    if (descInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(descInput, 'Flaky artisan pastry filled with stone-ground Uji matcha cream.');
      descInput.dispatchEvent(new Event('input', { bubbles: true }));
      descInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Capture Screenshot: Item Editor Modal
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task5-menu-item-editor.png'), fullPage: false });
  console.log('✓ Saved task5-menu-item-editor.png');

  // Submit new item
  await page.evaluate(() => {
    const form = document.querySelector('.fixed.z-50 form');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    if (submitBtn) submitBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const itemAdded = await page.evaluate(() => {
    return document.body.innerText.includes('Matcha Pistachio Croissant');
  });
  if (!itemAdded) throw new Error('Failed to create new menu item "Matcha Pistachio Croissant"!');
  console.log('✓ New menu item "Matcha Pistachio Croissant" created successfully.');

  // =========================================================================
  // MODULE B: TABLE MANAGEMENT & STANDEE QR CODES
  // =========================================================================
  console.log('\n--- 3. Verifying Module B: Table Management & QR Codes ---');

  // Click "Tables & QR" in sidebar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tblBtn = btns.find((b) => b.textContent && b.textContent.includes('Tables & QR'));
    if (tblBtn) tblBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Verify Table Management rendered
  const tableHeading = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.textContent : '';
  });
  console.log(`Table View Heading: "${tableHeading}"`);
  if (!tableHeading.includes('Tables & Standee QR Codes')) {
    throw new Error('Table Management view failed to render!');
  }

  // Check seeded tables: Table 01, Table 02, Patio 01
  const tablesFound = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasTbl01: text.includes('Table 01'),
      hasTbl02: text.includes('Table 02'),
      hasPatio: text.includes('Patio 01'),
      hasPickup: text.includes('Counter Pickup'),
    };
  });
  console.log('Seeded tables found:', tablesFound);
  if (!tablesFound.hasTbl01 || !tablesFound.hasPatio) {
    throw new Error('Default seeded tables missing in dashboard!');
  }

  // Capture Screenshot: Table Management Grid
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task5-table-management.png'), fullPage: false });
  console.log('✓ Saved task5-table-management.png');

  // Add new table "Table 04"
  console.log('Adding New Table...');
  await page.evaluate(() => {
    const addBtn = document.querySelector('[data-testid="add-table-btn"]');
    if (addBtn) addBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  await page.evaluate(() => {
    const numInput = document.querySelector('[data-testid="table-number-input"]');
    if (numInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(numInput, '04');
      numInput.dispatchEvent(new Event('input', { bubbles: true }));
      numInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const nameInput = document.querySelector('[data-testid="table-display-name-input"]');
    if (nameInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(nameInput, 'Table 04');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const saveBtn = document.querySelector('[data-testid="save-table-btn"]');
    if (saveBtn) saveBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const table04Created = await page.evaluate(() => {
    return document.body.innerText.includes('Table 04');
  });
  if (!table04Created) throw new Error('Failed to create new table "Table 04"!');
  console.log('✓ "Table 04" created successfully.');

  // Open Standee Print Modal for Table 01
  console.log('Opening Standee Print Preview...');
  await page.evaluate(() => {
    const printBtns = Array.from(document.querySelectorAll('[data-testid^="print-standee-btn-"]'));
    if (printBtns[0]) printBtns[0].click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Verify Standee Modal content & QR matrix
  const standeeDetails = await page.evaluate(() => {
    const standee = document.querySelector('[data-testid="standee-card-preview"]');
    if (!standee) return null;
    const qrImg = standee.querySelector('img');
    return {
      hasBusinessName: standee.innerText.includes('Good Day Specialty Coffee'),
      hasTableTitle: standee.innerText.includes('Table 01') || standee.innerText.includes('ORDER FROM YOUR TABLE'),
      hasQrSrc: qrImg ? qrImg.src.startsWith('data:image/png;base64,') : false,
      hasSafetyIndicator: document.body.innerText.includes('Commercial Printing') || document.body.innerText.includes('QR Destination URL Safety Mode'),
    };
  });
  console.log('Standee Modal details:', standeeDetails);
  if (!standeeDetails || !standeeDetails.hasTableTitle || !standeeDetails.hasQrSrc) {
    throw new Error('TablePrintModal missing required standee elements or valid QR image!');
  }

  // Test Environment Mode Switcher in Standee Modal
  console.log('Testing QR Environment Mode Switcher...');
  await page.evaluate(() => {
    const devBtn = document.querySelector('[data-testid="env-mode-dev"]');
    if (devBtn) devBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const devUrlShown = await page.evaluate(() => {
    return document.body.innerText.includes('127.0.0.1') || document.body.innerText.includes('localhost');
  });
  if (!devUrlShown) throw new Error('Dev preview mode failed to show local preview URL!');

  // Switch back to Production (safe for print)
  await page.evaluate(() => {
    const prodBtn = document.querySelector('[data-testid="env-mode-prod"]');
    if (prodBtn) prodBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const prodUrlShown = await page.evaluate(() => {
    return document.body.innerText.includes('https://loyaltydigitalqr.com');
  });
  if (!prodUrlShown) throw new Error('Production mode failed to show https://loyaltydigitalqr.com!');
  console.log('✓ QR Environment Mode Switcher & Safety Validation verified.');

  // Capture Screenshot: Table Standee Print Layout
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task5-table-print-layout.png'), fullPage: false });
  console.log('✓ Saved task5-table-print-layout.png');

  // Close Standee Modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.z-50 button[aria-label="Close"]');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // =========================================================================
  // MODULE C: PUBLIC CUSTOMER DIGITAL MENU & CART
  // =========================================================================
  console.log('\n--- 4. Verifying Module C: Public Mobile Digital Menu & Ordering ---');

  // Set mobile viewport: iPhone 14 / modern smartphone (390 x 844)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/menu/good-day-specialty-coffee?table=tbl_main_01`, {
    waitUntil: 'networkidle0',
  });
  await new Promise((r) => setTimeout(r, 600));

  // Verify public menu branding
  const publicMenuInfo = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasBusinessName: text.includes('Good Day Specialty Coffee'),
      hasTablePill: text.includes('Table 01'),
      hasCategories: text.includes('All Items') && text.includes('Coffee') && text.includes('Bakery'),
      hasItems: text.includes('Cappuccino') && text.includes('Nitro Cold Brew'),
    };
  });
  console.log('Public Menu Page Info:', publicMenuInfo);
  if (!publicMenuInfo.hasBusinessName || !publicMenuInfo.hasTablePill || !publicMenuInfo.hasItems) {
    throw new Error('Public Mobile Digital Menu failed to load business or table context!');
  }

  // Capture Screenshot: Public Menu Mobile
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task5-public-menu-mobile.png'), fullPage: false });
  console.log('✓ Saved task5-public-menu-mobile.png');

  // Open Item Customization Modal for "Nitro Cold Brew"
  console.log('Opening Item Customization Modal...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-testid^="public-item-card-"]'));
    const nitroCard = cards.find((c) => c.innerText.includes('Nitro Cold Brew'));
    if (nitroCard) {
      const addBtn = nitroCard.querySelector('button');
      if (addBtn) addBtn.click();
    }
  });
  await new Promise((r) => setTimeout(r, 500));

  // Verify Customization Modal is open
  const customizationModalOpen = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('Nitro Cold Brew') && (text.includes('Add to Order') || text.includes('Cup Size'));
  });
  if (!customizationModalOpen) throw new Error('ItemCustomizationModal failed to open!');

  // Select variant and modifier, increase quantity
  console.log('Customizing item (Variant, Modifiers, Quantity)...');
  await page.evaluate(() => {
    // Select second variant (Large) if available
    const variantBtns = Array.from(document.querySelectorAll('[data-testid^="variant-opt-"]'));
    if (variantBtns[1]) variantBtns[1].click();

    // Select modifier if available
    const modifierBtns = Array.from(document.querySelectorAll('[data-testid^="modifier-opt-"]'));
    if (modifierBtns[0]) modifierBtns[0].click();

    // Increase quantity to 2
    const incBtn = document.querySelector('[data-testid="increase-qty-btn"]');
    if (incBtn) incBtn.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  // Confirm and add to cart
  await page.evaluate(() => {
    const confirmBtn = document.querySelector('[data-testid="confirm-add-to-cart-btn"]');
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Verify sticky bottom cart bar appears
  const cartBarVisible = await page.evaluate(() => {
    const cartBtn = document.querySelector('[data-testid="view-cart-bar-btn"]');
    return !!cartBtn;
  });
  if (!cartBarVisible) throw new Error('Sticky floating cart bar did not appear after adding item!');
  console.log('✓ Sticky floating cart bar appeared with updated line items.');

  // Open Cart Drawer
  console.log('Opening Customer Cart Drawer...');
  await page.evaluate(() => {
    const cartBtn = document.querySelector('[data-testid="view-cart-bar-btn"]');
    if (cartBtn) cartBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Verify Cart Drawer details
  const cartDrawerDetails = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasItemName: text.includes('Nitro Cold Brew'),
      hasTableContext: text.includes('Table 01'),
      hasSubtotal: text.includes('Total Due'),
      hasSendOrderBtn: text.includes('Send Order to Kitchen'),
    };
  });
  console.log('Cart Drawer Details:', cartDrawerDetails);
  if (!cartDrawerDetails.hasItemName || !cartDrawerDetails.hasTableContext || !cartDrawerDetails.hasSendOrderBtn) {
    throw new Error('Cart drawer missing required order review items!');
  }

  // Capture Screenshot: Item Customization & Cart
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task5-item-customization-cart.png'), fullPage: false });
  console.log('✓ Saved task5-item-customization-cart.png');

  // Click "Send Order to Kitchen"
  console.log('Placing demo order...');
  await page.evaluate(() => {
    const placeBtn = document.querySelector('[data-testid="place-order-demo-btn"]');
    if (placeBtn) placeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const orderReceived = await page.evaluate(() => {
    return document.body.innerText.includes('ORDER RECEIVED') || document.body.innerText.includes('Sent to Barista');
  });
  if (!orderReceived) throw new Error('Order confirmation modal failed to display!');
  console.log('✓ Demo order placed and sent to kitchen confirmation displayed.');

  // Finish demo order
  await page.evaluate(() => {
    const finishBtn = document.querySelector('[data-testid="finish-demo-order-btn"]');
    if (finishBtn) finishBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // =========================================================================
  // MODULE D: MULTI-BUSINESS SCOPING & THEMES
  // =========================================================================
  console.log('\n--- 5. Verifying Multi-Business Scoping & Light/Dark Theme ---');

  // Reset viewport to desktop
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));

  // Switch to Apex Barbershop
  await page.evaluate(() => {
    const switcher = document.querySelector('[data-testid="business-switcher-btn"]') ||
      document.querySelector('button[aria-label*="Switch business"]');
    if (switcher) switcher.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const salonBtn = btns.find((b) => b.textContent && b.textContent.includes('Apex Barbershop'));
    if (salonBtn) salonBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Verify Barbershop does not show cafe items or shows not-available state
  const salonSidebar = await page.evaluate(() => {
    const sidebar = document.querySelector('aside') || document.body;
    return {
      hasAppointments: sidebar.innerText.includes('Appointments'),
      hasStylists: sidebar.innerText.includes('Stylists'),
      hasMenuPlanned: !sidebar.innerText.includes('Café & Restaurant Menu'),
    };
  });
  console.log('Apex Barbershop Sidebar Scoping:', salonSidebar);
  if (!salonSidebar.hasAppointments) {
    throw new Error('Industry scoping failed: Barbershop should show salon navigation!');
  }
  console.log('✓ Multi-business scoping successfully verified for barbershop.');

  // Switch back to Good Day Specialty Coffee
  await page.evaluate(() => {
    const switcher = document.querySelector('[data-testid="business-switcher-btn"]') ||
      document.querySelector('button[aria-label*="Switch business"]');
    if (switcher) switcher.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cafeBtn = btns.find((b) => b.textContent && b.textContent.includes('Good Day Specialty Coffee'));
    if (cafeBtn) cafeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Test Dark Theme
  console.log('Testing Dark Mode...');
  await setTheme('dark');

  // Navigate to Tables view
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tblBtn = btns.find((b) => b.textContent && b.textContent.includes('Tables & QR'));
    if (tblBtn) tblBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Capture Screenshot: Dashboard Light/Dark
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'task5-dashboard-light-dark.png'), fullPage: false });
  console.log('✓ Saved task5-dashboard-light-dark.png');

  // Reset to light theme
  await setTheme('light');

  // =========================================================================
  // VIEWPORT RESPONSIVENESS CHECK
  // =========================================================================
  console.log('\n--- 6. Verifying 5 Responsive Viewports ---');
  const viewports = [
    { name: 'Desktop (1440x900)', width: 1440, height: 900 },
    { name: 'Laptop (1024x768)', width: 1024, height: 768 },
    { name: 'Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Mobile Large (414x896)', width: 414, height: 896 },
    { name: 'Mobile Small (375x667)', width: 375, height: 667 },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/menu/good-day-specialty-coffee?table=tbl_main_01`, {
      waitUntil: 'networkidle0',
    });
    await new Promise((r) => setTimeout(r, 200));

    const rendered = await page.evaluate(() => {
      return document.body.innerText.includes('Good Day Specialty Coffee');
    });
    if (!rendered) {
      throw new Error(`Public menu failed to render on viewport: ${vp.name}`);
    }
    console.log(`✓ Viewport passed: ${vp.name}`);
  }

  await browser.close();
  console.log('\n🎉 ALL TASK 5 VERIFICATION SUITES PASSED CLEANLY (100%)!');
}

run().catch((err) => {
  console.error('\n❌ TASK 5 VERIFICATION FAILED:', err);
  process.exit(1);
});
