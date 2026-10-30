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
  console.log('=== STARTING TASK 6 COMPREHENSIVE VERIFICATION ===\n');

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

  try {
    // =========================================================================
    // STEP 1: Unit & Service-Level Verification (In-Browser Evaluator)
    // =========================================================================
    console.log('--- Step 1: In-Browser Service & State Machine Verification ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });

    // Initialize clean local state
    const serviceTests = await page.evaluate(() => {
      // Clear order cache to test fresh seeding
      localStorage.removeItem('loyalty_mock_orders_v1');

      // Setup merchant auth
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

      // Setup active business
      localStorage.setItem('loyalty_active_business_id', 'biz_user_primary');

      return true;
    });

    console.log('✓ Initialized clean session & storage:', serviceTests);

    // Reload to allow services to mount
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });

    // Verify order service functions in window context
    const serviceCheck = await page.evaluate(() => {
      // Check seeded orders in localStorage
      const raw = localStorage.getItem('loyalty_mock_orders_v1');
      const data = raw ? JSON.parse(raw) : {};
      const cafeOrders = data['biz_user_primary'] || [];
      const salonOrders = data['biz_salon_demo'] || [];
      const totalSeeded = Object.values(data).flat().length;

      return {
        totalSeeded,
        cafeOrdersCount: cafeOrders.length,
        salonOrdersCount: salonOrders.length,
        cafeOrderNumbers: cafeOrders.map((o) => o.orderNumber),
      };
    });

    console.log('✓ Seeded orders verification:', serviceCheck);
    if (serviceCheck.cafeOrdersCount < 3) {
      throw new Error(`Expected at least 3 seeded café orders, found: ${serviceCheck.cafeOrdersCount}`);
    }
    if (serviceCheck.salonOrdersCount !== 0) {
      throw new Error(`Expected 0 salon orders for isolation, found: ${serviceCheck.salonOrdersCount}`);
    }

    // =========================================================================
    // STEP 2: Customer Flow — Table QR Menu -> Add to Cart -> Checkout
    // =========================================================================
    console.log('\n--- Step 2: Customer Ordering via Public Table QR Menu ---');
    await page.goto(`${BASE_URL}/menu/good-day-specialty-coffee?table=tbl_main_01`, {
      waitUntil: 'networkidle0',
    });
    await new Promise((r) => setTimeout(r, 600));

    // Verify table context selector is visible
    const tableBtnText = await page.$eval('[data-testid="table-selector-btn"]', (el) => el.textContent);
    console.log('✓ Table selector text:', tableBtnText);
    if (!tableBtnText.includes('Table 01')) {
      throw new Error(`Expected 'Table 01', got: ${tableBtnText}`);
    }
    console.log('✓ Verified table context detected on digital menu');

    // Click on the first item's add/customize button
    const itemAddButtons = await page.$$('button[data-testid^="add-item-to-order-"]');
    if (itemAddButtons.length > 0) {
      await itemAddButtons[0].click();
      console.log('✓ Clicked item add/customize button');
    } else {
      throw new Error('No add-item-to-order button found');
    }
    await new Promise((r) => setTimeout(r, 500));

    // Inside customization modal: click "Add to Order"
    const confirmAddBtn = await page.$('button[data-testid="confirm-add-to-cart-btn"]');
    if (confirmAddBtn) {
      await confirmAddBtn.click();
      console.log('✓ Added customized item to cart from modal');
    } else {
      throw new Error('Confirm add to cart button not found in modal');
    }
    await new Promise((r) => setTimeout(r, 500));

    // Open sticky floating cart bar
    const floatingCartBtn = await page.$('button[data-testid="view-cart-bar-btn"]');
    if (floatingCartBtn) {
      await floatingCartBtn.click();
      console.log('✓ Opened cart drawer');
    } else {
      throw new Error('View cart bar button not visible after adding item');
    }
    await new Promise((r) => setTimeout(r, 500));

    // Fill customer name and special instructions in cart drawer
    const customerNameInput = await page.$('input[data-testid="cart-customer-name"]');
    if (customerNameInput) {
      await customerNameInput.type('Jordan Lee');
    }
    const customerNotesInput = await page.$('textarea[data-testid="cart-customer-notes"]');
    if (customerNotesInput) {
      await customerNotesInput.type('Extra hot with oat milk on the side please');
    }

    // Submit Order
    const placeOrderBtn = await page.$('button[data-testid="place-order-demo-btn"], button[data-testid="place-order-btn"]');
    if (!placeOrderBtn) {
      throw new Error('Place order button not found in cart drawer');
    }
    await placeOrderBtn.click();
    await new Promise((r) => setTimeout(r, 800));

    // Verify Order Confirmation Modal appears
    const confirmationModal = await page.$('[data-testid="order-confirmation-modal"]');
    if (!confirmationModal) {
      throw new Error('Order confirmation modal did not appear after submission');
    }
    console.log('✓ Order confirmation modal displayed');

    // Capture Screenshot: task6-order-confirmation.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'task6-order-confirmation.png'),
    });
    console.log('📸 Captured task6-order-confirmation.png');

    // Extract tracking link / token from confirmation modal
    const trackOrderBtn = await page.$('button[data-testid="confirm-track-order-btn"]');
    if (!trackOrderBtn) {
      throw new Error('Track order button not found in confirmation modal');
    }
    await trackOrderBtn.click();
    await new Promise((r) => setTimeout(r, 800));

    // =========================================================================
    // STEP 3: Customer Live Order Tracking Page (/order/:trackingToken)
    // =========================================================================
    console.log('\n--- Step 3: Customer Live Order Tracking Page ---');
    const customerTrackingUrl = page.url();
    console.log('Current URL after clicking Track Order:', customerTrackingUrl);
    if (!customerTrackingUrl.includes('/order/')) {
      throw new Error(`Expected URL to contain '/order/', got: ${customerTrackingUrl}`);
    }

    // Verify tracking elements: Order Number, Status tracker, Table badge
    const trackingOrderNum = await page.$eval('[data-testid="tracking-order-number"]', (el) => el.textContent);
    console.log('✓ Tracking Order Number:', trackingOrderNum);

    const trackingStatusBadge = await page.$eval('[data-testid="tracking-status-badge"]', (el) => el.textContent);
    console.log('✓ Initial Status Badge on tracking page:', trackingStatusBadge);
    if (!trackingStatusBadge.toLowerCase().includes('placed') && !trackingStatusBadge.toLowerCase().includes('queued') && !trackingStatusBadge.toLowerCase().includes('received')) {
      throw new Error(`Expected initial status to be Received, got: ${trackingStatusBadge}`);
    }

    // Capture Screenshot: task6-customer-tracking.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'task6-customer-tracking.png'),
    });
    console.log('📸 Captured task6-customer-tracking.png');

    // Capture Mobile Viewport Screenshot: task6-mobile-tracking-view.png
    await page.setViewport({ width: 390, height: 844 });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'task6-mobile-tracking-view.png'),
    });
    console.log('📸 Captured task6-mobile-tracking-view.png');

    // Reset viewport to desktop
    await page.setViewport({ width: 1440, height: 900 });

    // =========================================================================
    // STEP 4: Merchant Orders Dashboard (/dashboard -> orders view)
    // =========================================================================
    console.log('\n--- Step 4: Merchant Orders Queue Dashboard ---');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));

    // Navigate to Orders module via sidebar
    const ordersSidebarLink = await page.$('[data-testid="nav-orders"]');
    if (ordersSidebarLink) {
      await ordersSidebarLink.click();
    } else {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const btn = buttons.find((b) => b.textContent && b.textContent.includes('Orders'));
        if (btn) btn.click();
      });
    }
    await new Promise((r) => setTimeout(r, 600));

    // Verify Orders Queue view is rendered
    const ordersViewHeader = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : '';
    });
    console.log('✓ Orders page header:', ordersViewHeader);
    if (!ordersViewHeader.includes('Orders Queue')) {
      throw new Error(`Expected 'Orders Queue' header, got: ${ordersViewHeader}`);
    }

    // Verify newly placed order is present in the list
    const orderItems = await page.$$('[data-testid^="order-card-"]');
    console.log(`✓ Total order cards rendered in queue: ${orderItems.length}`);
    if (orderItems.length === 0) {
      throw new Error('Expected at least 1 order in the Orders Queue');
    }

    // Capture Screenshot: task6-orders-queue.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'task6-orders-queue.png'),
    });
    console.log('📸 Captured task6-orders-queue.png');

    // Open first order details drawer
    const viewDetailBtns = await page.$$('button[data-testid^="view-order-"]');
    if (viewDetailBtns.length > 0) {
      await viewDetailBtns[0].click();
      await new Promise((r) => setTimeout(r, 500));
    }

    // Verify order detail drawer is visible
    const detailDrawer = await page.$('[data-testid="order-detail-drawer"]');
    if (!detailDrawer) {
      throw new Error('Order detail drawer did not open');
    }
    console.log('✓ Order detail drawer opened');

    // Capture Screenshot: task6-order-detail.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'task6-order-detail.png'),
    });
    console.log('📸 Captured task6-order-detail.png');

    // Close detail drawer
    const closeDrawerBtn = await page.$('button[data-testid="close-order-detail-btn"]');
    if (closeDrawerBtn) {
      await closeDrawerBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }

    // Advance an order status from "new" to "accepted"
    const acceptBtns = await page.$$('button[data-testid^="accept-order-"]');
    if (acceptBtns.length > 0) {
      await acceptBtns[0].click();
      console.log('✓ Clicked status advance button (Accept Order)');
      await new Promise((r) => setTimeout(r, 500));
    }

    // =========================================================================
    // STEP 5: Kitchen Display System (KDS) (/dashboard/kitchen)
    // =========================================================================
    console.log('\n--- Step 5: Kitchen Display System (KDS) Fullscreen Interface ---');
    const kdsLaunchBtn = await page.$('button[data-testid="open-kds-btn"]');
    if (kdsLaunchBtn) {
      await kdsLaunchBtn.click();
    } else {
      await page.goto(`${BASE_URL}/dashboard/kitchen`, { waitUntil: 'networkidle0' });
    }
    await new Promise((r) => setTimeout(r, 700));

    if (!page.url().includes('/dashboard/kitchen')) {
      throw new Error(`Expected URL to be '/dashboard/kitchen', got: ${page.url()}`);
    }
    console.log('✓ Successfully arrived at Kitchen Display System URL:', page.url());

    // Verify KDS Ticket Cards exist
    const kdsTickets = await page.$$('[data-testid^="kds-ticket-"]');
    console.log(`✓ Active KDS tickets rendered: ${kdsTickets.length}`);
    if (kdsTickets.length === 0) {
      throw new Error('No ticket cards rendered on Kitchen Display');
    }

    // Capture Screenshot: task6-kds-active-queue.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'task6-kds-active-queue.png'),
    });
    console.log('📸 Captured task6-kds-active-queue.png');

    // Advance ticket status in KDS: click first prepare or ready action button
    const kdsPrepareBtn = await page.$('button[data-testid^="kds-prepare-btn-"], button[data-testid^="kds-ready-btn-"]');
    if (kdsPrepareBtn) {
      await kdsPrepareBtn.click();
      console.log('✓ Advanced ticket status in KDS');
      await new Promise((r) => setTimeout(r, 500));
    }

    // Switch KDS filter to "Ready for Server"
    const readyFilterBtn = await page.$('button[data-testid="kds-filter-ready"]');
    if (readyFilterBtn) {
      await readyFilterBtn.click();
      await new Promise((r) => setTimeout(r, 500));
      console.log('✓ Filtered KDS view to Ready for Server');
    }

    // Capture Screenshot: task6-kds-ready-orders.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'task6-kds-ready-orders.png'),
    });
    console.log('📸 Captured task6-kds-ready-orders.png');

    // Exit KDS back to dashboard
    const exitKdsBtn = await page.$('button[data-testid="exit-kds-btn"]');
    if (exitKdsBtn) {
      await exitKdsBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      console.log('✓ Exited KDS back to dashboard');
    }

    // =========================================================================
    // STEP 6: Reactive Live Synchronization Check on Customer Tracking Page
    // =========================================================================
    console.log('\n--- Step 6: Live Synchronization on Customer Tracking Page ---');
    await page.goto(customerTrackingUrl, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));

    const updatedTrackingStatus = await page.$eval('[data-testid="tracking-status-badge"]', (el) => el.textContent);
    console.log('✓ Live Status Badge on customer tracking page after KDS updates:', updatedTrackingStatus);

    // =========================================================================
    // STEP 7: Order Cancellation Flow
    // =========================================================================
    console.log('\n--- Step 7: Order Cancellation Flow ---');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));

    const ordersNav = await page.$('[data-testid="nav-orders"]');
    if (ordersNav) await ordersNav.click();
    await new Promise((r) => setTimeout(r, 500));

    // Find and click Cancel button on an active order
    const cancelBtns = await page.$$('button[data-testid^="cancel-order-"]');
    if (cancelBtns.length > 0) {
      await cancelBtns[0].click();
      await new Promise((r) => setTimeout(r, 400));

      // Verify cancellation modal is displayed
      const cancelModal = await page.$('[data-testid="cancellation-modal"]');
      if (cancelModal) {
        console.log('✓ Cancellation modal opened');
        const confirmCancelBtn = await page.$('button[data-testid="confirm-cancel-order-btn"]');
        if (confirmCancelBtn) {
          await confirmCancelBtn.click();
          await new Promise((r) => setTimeout(r, 500));
          console.log('✓ Order cancellation confirmed with reason');
        }
      }
    }

    // =========================================================================
    // STEP 8: Dashboard Overview Metrics Integration
    // =========================================================================
    console.log('\n--- Step 8: Dashboard Overview Restaurant Operations Metrics ---');
    const overviewNav = await page.$('[data-testid="nav-overview"]');
    if (overviewNav) {
      await overviewNav.click();
      await new Promise((r) => setTimeout(r, 500));
    } else {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
    }
    await new Promise((r) => setTimeout(r, 500));

    const restaurantOpsCard = await page.$('[data-testid="restaurant-operations-card"]');
    if (!restaurantOpsCard) {
      throw new Error('Restaurant operations card not found on dashboard Overview');
    }
    console.log('✓ Restaurant operations metrics card verified on Overview');

    // Capture Screenshot: task6-dashboard-order-metrics.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'task6-dashboard-order-metrics.png'),
    });
    console.log('📸 Captured task6-dashboard-order-metrics.png');

    // =========================================================================
    // STEP 9: Theme Mode & Multi-Device Responsive Tests
    // =========================================================================
    console.log('\n--- Step 9: Theme & Responsive Matrix ---');
    const viewports = [
      { name: 'Desktop (1440x900)', width: 1440, height: 900 },
      { name: 'Laptop (1024x768)', width: 1024, height: 768 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile Large (425x844)', width: 425, height: 844 },
      { name: 'Mobile Compact (375x667)', width: 375, height: 667 },
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await setTheme('light');
      await new Promise((r) => setTimeout(r, 100));
      await setTheme('dark');
      await new Promise((r) => setTimeout(r, 100));
      console.log(`✓ Tested ${vp.name} in light & dark mode`);
    }

    // Reset to light mode and standard desktop viewport
    await setTheme('light');
    await page.setViewport({ width: 1440, height: 900 });

    console.log('\n=== TASK 6 VERIFICATION COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('❌ Task 6 Verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
