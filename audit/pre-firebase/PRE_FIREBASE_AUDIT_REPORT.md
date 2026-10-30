# Loyaltydigitalqr — Pre-Firebase Comprehensive Product Audit
**Audit Scope:** Tasks 1–9 Baseline Verification & Readiness Checkpoint  
**Deliverable Directory:** `audit/pre-firebase/`  
**Date of Audit:** October 29, 2026  
**Auditor:** Antigravity Autonomous Pair Programmer  

---

## 1. Executive Summary

This executive summary provides direct, unhedged answers to the 12 core questions mandated by Section 15 of the audit specification:

### 1. What percentage of identified requirements are VERIFIED_WORKING, and what is the denominator?
- **Total Identifiable Requirements (Denominator):** **108** discrete functional and architectural requirements.
- **VERIFIED_WORKING:** **97** requirements (**89.81%**).
- **Status Breakdown:**
  - `VERIFIED_WORKING`: 97 (89.81%)
  - `PARTIAL`: 3 (2.78%)
  - `BROKEN`: 3 (2.78%)
  - `MISSING`: 4 (3.70%)
  - `FIREBASE_DEPENDENT`: 1 (0.93%)
- **Counting Methodology:** Each requirement was verified individually against source code implementation and executed via Puppeteer runtime test suites. Partial requirements are strictly counted as non-verified until every behavioral assertion passes without qualification.

### 2. Which important requirements are only partially implemented?
1. **Multi-Location Selection Persistence (`REQ-T3-07`):** `mockBusinessService.setActiveLocation()` updates an ephemeral object in an in-memory array returned by `getInitialBusinesses()`. It does not write to `localStorage`, so switching active locations is lost immediately upon page reload.
2. **Staff PIN Stamp Issuance Validation (`REQ-T4-02`):** `StampIssuanceModal.tsx` checks only that the entered PIN has `length >= 4`. It does not verify equality against the location's `defaultStaffPin` (`4821`), allowing any 4 digits to issue stamps. Additionally, the modal displays a helper button exposing the plaintext PIN directly above the input.
3. **Analytics Gross Value Estimation (`REQ-T9-08`):** Orders, retail, and salon gross revenues are calculated from exact historical transaction amounts; however, gym memberships and car wash passes lack transaction price fields, forcing `mockGrowthService.ts` to compute gross value using flat estimates ($35.00 per pass and $59.00 per member).

### 3. Which promised features are missing or unverified?
1. **Industry Landing Routes for Retail, Gyms, Car Wash, and Restaurants (`REQ-T1-11`):** While metadata exists in `src/data/industriesData.ts`, `src/App.tsx` only handles `/industries/cafes` and `/industries/salons`. Visiting `/industries/retail`, `/industries/gyms`, or `/industries/carwash` silently falls through to `HomePage`.
2. **Dedicated 404 Error Screen (`REQ-XC-01`):** `App.tsx` has no 404 Not Found route handler. Any unmatched route silently renders `HomePage`.
3. **Deep Linking to Dashboard Sub-Views (`REQ-XC-02`):** `DashboardPage.tsx` maintains active views (`loyalty`, `orders`, `analytics`, `qr-studio`, etc.) in React local state (`useState('overview')`). Browser refresh (F5) always resets the view to `overview`.
4. **Standard Unit / Component Test Runner (`REQ-XC-05`):** `package.json` contains no `vitest`, `jest`, or `@testing-library/react` dependencies or `npm test` script. Testing is conducted entirely through custom browser automation scripts.

### 4. Which flows were genuinely tested end to end?
Nine complete multi-step journeys were exercised end to end in a headless Chrome browser against the live preview server:
1. **Public Marketing & Region Canonicalization:** Direct navigation across `/`, `/pricing`, `/usa`, `/india`, and automated redirect from `/India` to `/india` across 5 viewports.
2. **Onboarding Wizard & State Preservation:** 5-step onboarding flow, field validation error triggers, backwards navigation preserving form state, and demo launch confetti.
3. **Multi-Business Switching & Workspace Reconfiguration:** Switching between Coffee Shop and Barbershop, verifying that sidebar navigation and overview cards reconfigure dynamically.
4. **Loyalty Program & Real QR Scanning:** Configuration updates, stamp issuance, reward redemption burning, and in-browser computer vision matrix decoding via `jsQR` confirming the encoded URL payload.
5. **Customer Digital Menu & Table Ordering:** Opening `/menu/good-day-specialty-coffee?table=tbl_main_01`, selecting variants and modifiers, checking cart drawer totals, and submitting order.
6. **Live Order Management & Kitchen Synchronization:** Order dispatch, real-time tracking at `/order/:token`, merchant order queue updates, Kitchen Display System (KDS) status bumping at `/dashboard/kitchen`, and reactive status reflection on the customer tracking page.
7. **Salon Appointment Booking & Public Tracking:** Public 5-step booking flow at `/book/:slug`, conflict-free slot selection, client detail capture, booking confirmation, and sanitized live tracking at `/appointment/:token`.
8. **Multi-Industry Checkout & Check-In Terminals:** Retail in-store sale with CRM loyalty stamp, gym check-in with duplicate prevention, car wash pass redemption with cooldown guard, and generic service job creation.
9. **Growth Campaigns, Consent, Feedback & Analytics:** Promotional offer creation, counter redemption with duplicate member guard, email/SMS consent filtering, simulated winback execution, non-gated Google review link verification, and RFC 4180-compliant safe CSV export.

### 5. Which test suites exist, and which suites actually executed?
- **Build & Lint Suites:** `npm run build` (Rollup/TypeScript compilation) and `npm run lint` (`oxlint`) both executed and passed with code 0.
- **Verification Scripts (All 9 Executed Cleanly):**
  - `scripts/test-task1-verification.js` (PASS, exit 0)
  - `scripts/test-task2-verification.js` (PASS, exit 0)
  - `scripts/test-task3-verification.js` (PASS, exit 0)
  - `scripts/test-task4-verification.js` (PASS, exit 0)
  - `scripts/test-task5-verification.js` (PASS, exit 0)
  - `scripts/test-task6-verification.js` (PASS, exit 0)
  - `scripts/test-task7-verification.js` (PASS, exit 0)
  - `scripts/test-task8-verification.js` (PASS, exit 0)
  - `scripts/test-task9-verification.js` (PASS, exit 0)

### 6. Are there tests that can pass while the feature is functionally broken?
Yes. Three specific gaps were identified:
1. **Staff PIN Validation:** `test-task4-verification.js` types `<4` digits to trigger a length error, then types `4821` and passes. However, typing `9999` would also pass because `StampIssuanceModal.tsx` does not check PIN equality.
2. **KDS Authentication:** `test-task6-verification.js` accesses `/dashboard/kitchen` after already establishing a session in earlier test steps. It never asserts that unauthenticated visitors are blocked, allowing the missing auth guard on `/dashboard/kitchen` to pass unnoticed.
3. **Task 3 Placeholder Assertion:** `test-task3-verification.js` logs `hasTitle: false` for the Appointment placeholder view because Task 7 replaced it with the real salon appointments module, yet the test suite logs success without failing.

### 7. Are there any confirmed data integrity, business-isolation, permission, currency, or calculation bugs?
1. **Critical Route Security (`REQ-T6-11`, P0):** `/dashboard/kitchen` lacks any authentication guard.
2. **Order Enumeration Exposure (`REQ-T6-12`, P1):** `mockOrderService.getOrderByTrackingToken()` accepts sequential `orderNumber` values (`#1040`, `#1041`) or internal IDs in addition to unguessable tokens, allowing guest order enumeration.
3. **CSV Export Currency Symbol (`REQ-T9-10`, P3):** In `mockGrowthService.exportAnalyticsCsv()`, fixed discount offers in the promotions table hardcode `$` instead of using `business.currencySymbol` (`₹`).
4. **Gross Value Calculations (`REQ-T9-08`, P2):** Car wash and gym gross values in analytics rely on flat estimates rather than recorded purchase transactions.

### 8. What behaviours are still mock-only?
1. **Authentication & Identity:** User identity is stored in `localStorage` (`loyalty_mock_auth_user`). Passwords and OAuth tokens are simulated without cryptographic hashing.
2. **Data Storage & Mutation:** All 11 services persist data in browser `localStorage`. Data is client-local and does not sync across devices or browsers.
3. **Campaign Execution:** Win-back campaigns run as local simulations without dispatching real SMS, WhatsApp, or email messages.
4. **Team Invitations:** Inviting a team member logs a simulated pending record without sending real email invitations.
5. **Billing & Subscriptions:** Regional subscription status ($10/mo USA, ₹299/mo India) is a frontend display state without payment gateway webhooks.

### 9. Which security guarantees cannot exist until Firebase or a trusted backend is implemented?
1. **Enforced Access Control (RBAC):** The Role-to-Permissions matrix is currently a display reference. Restricting sensitive mutations requires Firebase Auth custom claims and Firestore Security Rules.
2. **Data Privacy & Tamper Resistance:** Client-side `localStorage` can be viewed and edited in DevTools. Securing private business data, guest contact details, and order receipts requires Firestore document-level read/write rules.
3. **Atomic Concurrency & Anti-Double-Booking:** True multi-user double-booking prevention and stamp threshold increments require server-side Firestore Transactions.
4. **Staff Credential Confidentiality:** Secure staff PIN verification requires comparing hashes via Firebase Cloud Functions rather than shipping plaintext location PINs to the browser.

### 10. What exactly must be fixed or tested before Firebase integration?
- **P0-01:** Add an authentication guard to `KitchenDisplayPage.tsx` to block unauthenticated visitors from accessing `/dashboard/kitchen`.
- **P1-01:** Restrict public order tracking lookups in `mockOrderService.ts` strictly to `trackingToken`.
- **P1-02:** Correct `StampIssuanceModal.tsx` to enforce strict PIN equality.

### 11. Which issues can safely be addressed during Firebase integration, and which should be corrected first?
- **Must Correct First:** P0-01 (KDS auth guard) and P1-01 (order lookup enumeration) should be fixed in the client router and service layer before wiring real backend endpoints.
- **Safely Addressed During Firebase Integration:**
  - RBAC enforcement (`REQ-T9-12`) is naturally solved when writing Firestore Security Rules.
  - Multi-location persistence (`REQ-T3-07`) is resolved when business location preferences are stored in Firestore.
  - Flat analytics estimates (`REQ-T9-08`) will be replaced when passes and memberships generate real transaction documents in Firestore.
  - Deep linking for dashboard tabs (`REQ-XC-02`) and 404 handler (`REQ-XC-01`) can be addressed during routing refactoring.

### 12. Is the project ready to start Task 10, conditionally ready, or not ready?
**CONDITIONALLY READY.**  
The application represents an exceptionally well-crafted, functional, multi-module business platform with 97 verified working requirements (89.81% passing rate) and zero TypeScript compilation errors. Once the P0 auth guard on `/dashboard/kitchen` and P1 token lookup restriction are applied, the codebase is fully prepared for Firebase integration in Task 10.

---

## 2. Repository & Test Environment Baseline

- **Operating System:** Windows 11 Pro (10.0.26100)
- **Node.js Version:** `v24.21.0`
- **TypeScript Version:** `~6.0.3`
- **Vite Version:** `^8.3.4` (Rolldown / Vite 8)
- **React Version:** `19.3.1` / `react-dom 19.3.1`
- **CSS Framework:** Tailwind CSS `^4.3.3` with `@tailwindcss/vite`
- **Icon Library:** `lucide-react 1.61.0` (zero emoji icons used for UI controls)
- **QR Engine:** `qrcode ^1.5.4` (rendering) + `jsqr ^1.4.0` (computer vision validation)
- **Browser Automation:** Headless Chrome via `puppeteer ^25.16.0`
- **Git Status:** Not a Git repository (untracked local workspace).
- **Environment Secrets / `.env`:** None detected. Zero exposed production API keys or leaked credentials in source code.

---

## 3. Overall Readiness Assessment & Requirement Status Counts

The requirement inventory comprises **108 discrete requirements** mapped across all completed prompts:

```
[========================================] 89.81% VERIFIED_WORKING (97 / 108)
[=                                       ]  3.70% MISSING          ( 4 / 108)
[=                                       ]  2.78% PARTIAL          ( 3 / 108)
[=                                       ]  2.78% BROKEN           ( 3 / 108)
[                                        ]  0.93% FIREBASE_DEP     ( 1 / 108)
```

| Classification | Count | Percentage | Definition |
|---|---|---|---|
| `VERIFIED_WORKING` | **97** | **89.81%** | Implemented in source code and proven working via automated runtime browser tests. |
| `PARTIAL` | **3** | **2.78%** | Implemented in part, but exhibits state reset or estimation gaps. |
| `BROKEN` | **3** | **2.78%** | Logic flaw, security bypass, or data exposure identified. |
| `MISSING` | **4** | **3.70%** | Expected route, component, or harness omitted from codebase. |
| `FIREBASE_DEPENDENT` | **1** | **0.93%** | Cannot be fully enforced client-side; requires trusted backend security rules. |
| **Total** | **108** | **100.0%** | Comprehensive Pre-Firebase Denominator. |

---

## 4. Task-by-Task Audit Findings (Tasks 1–9)

### Task 1: Branding, Public Website, Pricing & Industry Landing Pages
- **Intended Behavior:** Establish public presence, responsive marketing website, regional pricing ($10/mo USA, ₹299/mo India), region selection, and industry showcases without pricing on the homepage.
- **Actual Codebase Implementation:** 
  - `src/components/common/Header.tsx`, `Footer.tsx`, `Logo.tsx` render the brand consistently.
  - `src/pages/HomePage.tsx` cleanly omits subscription fees.
  - `src/pages/PricingSelectorPage.tsx`, `UsaPricingPage.tsx`, and `IndiaPricingPage.tsx` render localized pricing terms with 30-day trials and feature checklists.
  - `src/router/Router.tsx` automatically canonicalizes `/India` to `/india`.
- **Runtime Verification Evidence:** `test-task1-verification.js` passed all 24 assertions across 5 viewport widths (1536px, 1280px, 768px, 390px, 360px).
- **Defects & Gaps:**
  - `REQ-T1-11` (P2): Dedicated landing routes for Retail, Gyms, Car Wash, and Restaurants are missing in `App.tsx` switch statement, causing them to fall through to `HomePage`.

### Task 2: Mock Authentication, Signup & Onboarding
- **Intended Behavior:** Provide merchant login, regional signup, and a 5-step onboarding wizard storing draft progress and launching the workspace.
- **Actual Codebase Implementation:**
  - `src/pages/LoginPage.tsx` and `SignupPage.tsx` provide demo credentials and regional plan banners.
  - `src/pages/OnboardingPage.tsx` manages steps: Identity -> Modules -> Details -> Loyalty Rules -> Review.
  - `src/services/mockAuthService.ts` persists `loyalty_mock_auth_user`, `loyalty_onboarding_draft`, and `loyalty_onboarding_completed`.
- **Runtime Verification Evidence:** `test-task2-verification.js` verified validation errors on blank business names, form state preservation across back-navigation, and completion state with confetti.
- **Defects & Gaps:** None in mock scope. All intended behaviors functional.

### Task 3: Dashboard Shell, Business Switcher & Workspace Isolation
- **Intended Behavior:** Authenticated application shell, dynamic sidebar, overview metrics, business switcher, and settings.
- **Actual Codebase Implementation:**
  - `src/pages/DashboardPage.tsx` protects the route by redirecting unauthenticated visitors to `/login?redirect=/dashboard`.
  - `src/components/dashboard/DashboardSidebar.tsx` dynamically swaps modules based on active business type.
  - `src/components/dashboard/BusinessSwitcherModal.tsx` allows switching between primary and demo businesses.
- **Runtime Verification Evidence:** `test-task3-verification.js` verified auth guard redirect, overview metrics rendering, switching to Apex Barbershop, and sign out session destruction.
- **Defects & Gaps:**
  - `REQ-T3-07` (P2): `setActiveLocation` modifies an ephemeral in-memory object; resets on page reload.

### Task 4: Digital Loyalty, QR Studio & Customer CRM
- **Intended Behavior:** Manage loyalty passes, issue stamps with staff PIN, burn rewards, maintain customer CRM profiles, generate scannable QR codes, and isolate data between venues.
- **Actual Codebase Implementation:**
  - `src/services/mockLoyaltyService.ts` maintains customers, programs, events, and QR touchpoints.
  - `src/components/dashboard/loyalty/LoyaltyProgramView.tsx` allows updating visit thresholds.
  - `src/components/dashboard/qr/QrStudioView.tsx` renders QR matrices using `qrcode`.
  - `src/components/dashboard/customers/CustomerProfileDrawer.tsx` displays full visit timelines.
- **Runtime Verification Evidence:** `test-task4-verification.js` decoded canvas pixels via `jsQR`, verified zero customer/QR leakage between Coffee and Barbershop workspaces, and burned reward `#FREE-892`.
- **Defects & Gaps:**
  - `REQ-T4-02` (P1): `StampIssuanceModal.tsx` checks only PIN length >= 4, not equality against location PIN. Helper button displays counter PIN in plaintext.

### Task 5: Café Menu Management, Table QR & Public Digital Menu
- **Intended Behavior:** Menu categories and item CRUD, table creation, acrylic standee QR preview, and public mobile digital menu with cart customization and order submission.
- **Actual Codebase Implementation:**
  - `src/services/mockCafeService.ts` manages menu items and tables.
  - `src/pages/PublicMenuPage.tsx` renders mobile-first digital menu with table pill context.
  - `src/components/public/CartDrawer.tsx` computes itemized subtotal in minor units.
  - `src/utils/qrUrlBuilder.ts` includes safety validation warning against printing `localhost` QR codes.
- **Runtime Verification Evidence:** `test-task5-verification.js` verified menu CRUD, SOLD OUT toggle, duplication, standee preview, item modifiers, sticky cart bar, and demo order placement.
- **Defects & Gaps:** None. All cafe menu and table QR features operational.

### Task 6: Order Management, Kitchen Display & Live Tracking
- **Intended Behavior:** Live order queue, unique tracking tokens, Kitchen Display System (KDS), status advancement, customer live tracking, and cancellation.
- **Actual Codebase Implementation:**
  - `src/services/mockOrderService.ts` implements state machine transitions (`received` -> `preparing` -> `ready` -> `completed` / `cancelled`).
  - `src/pages/KitchenDisplayPage.tsx` provides high-contrast fullscreen line interface.
  - `src/pages/PublicOrderTrackingPage.tsx` subscribes to order updates reactively.
- **Runtime Verification Evidence:** `test-task6-verification.js` completed the full ordering lifecycle from table menu to KDS status bump to live customer tracking update.
- **Defects & Gaps:**
  - `REQ-T6-11` (P0): `KitchenDisplayPage.tsx` lacks an authentication guard. Unauthenticated visitors can view active kitchen tickets directly.
  - `REQ-T6-12` (P1): `getOrderByTrackingToken` allows looking up orders by sequential `orderNumber` (`#1040`), enabling order enumeration.

### Task 7: Salon & Barber Management
- **Intended Behavior:** Salon services catalog, staff availability scheduling, calendar grid, 5-step public booking wizard (`/book/:slug`), and customer live appointment tracking (`/appointment/:token`).
- **Actual Codebase Implementation:**
  - `src/services/mockSalonService.ts` manages appointments, stylists, and time slots.
  - `src/utils/salonScheduling.ts` calculates available intervals and prevents double-booking.
  - `src/pages/PublicBookingPage.tsx` guides customers through Service -> Stylist -> Slot -> Client Details -> Review.
  - `src/pages/PublicAppointmentTrackingPage.tsx` displays confirmed booking and strips staff internal notes.
- **Runtime Verification Evidence:** `test-task7-verification.js` booked appointment `#APT-1005`, confirmed slot conflict elimination, and verified strict isolation from cafe operations.
- **Defects & Gaps:** None. Appointment scheduling and tracking operational.

### Task 8: Industry-Specific Modules (Retail, Gym, Car Wash, Generic Service)
- **Intended Behavior:** Dedicated operational tools for Retail (catalogue, in-store sale, lookbook), Gym (roster, check-in terminal, classes), Car Wash (services, bundles, pass terminal), and Generic Services (rate card, job log).
- **Actual Codebase Implementation:**
  - `src/services/mockRetailService.ts`, `mockGymService.ts`, `mockCarWashService.ts`, and `mockGenericService.ts`.
  - Terminals enforce business rules: gym prevents duplicate same-day check-in and rejects expired memberships; car wash enforces cooldown and rejects exhausted passes.
- **Runtime Verification Evidence:** `test-task8-verification.js` verified all 4 vertical tools, customer stamp linkage, rejection behaviors, and workspace isolation.
- **Defects & Gaps:** None. All vertical modules verified.

### Task 9: Growth, Campaigns, Analytics & Administration
- **Intended Behavior:** Promotional offers, duplicate redemption protection, consent-aware customer segments, winback campaign simulation, customer feedback collection with non-gating policy, truthful analytics with date filters, safe CSV export, and role-to-permissions matrix.
- **Actual Codebase Implementation:**
  - `src/services/mockGrowthService.ts` implements offers, redemptions, segments, feedback, analytics, and CSV export.
  - `src/components/dashboard/growth/CampaignsAndOffersView.tsx` provides multi-tab growth console.
  - `src/components/dashboard/growth/AnalyticsView.tsx` computes gross value, stamps, and repeat rates across date filters.
- **Runtime Verification Evidence:** `test-task9-verification.js` verified offer creation, duplicate redemption blocking, consent metrics, simulated campaign badges, non-gating review link, date range recalculations, and CSV escaping.
- **Defects & Gaps:**
  - `REQ-T9-08` (P2): Pass and gym gross values rely on flat estimates ($35/$59) due to unmodeled transaction amounts.
  - `REQ-T9-10` (P3): CSV export hardcodes `$` in offer discount labels for Indian businesses.
  - `REQ-T9-12` (P1/Firebase): Client-side role matrix is display-only; no RBAC checks on API calls.

---

## 5. Detailed Route and Navigation Inventory

| Route Path | Type | Auth Required | Purpose / Screen | Audit Status |
|---|---|---|---|---|
| `/` | Public | No | Marketing homepage, card builder modal, demo video modal, FAQ | **VERIFIED_WORKING** |
| `/pricing` | Public | No | Region selector (United States vs India) | **VERIFIED_WORKING** |
| `/usa` | Public | No | US pricing ($10/mo, Starter plan terms, 30 days free, FAQ) | **VERIFIED_WORKING** |
| `/india` | Public | No | India pricing (₹299/mo, Starter plan terms, 30 days free, FAQ) | **VERIFIED_WORKING** |
| `/industries/cafes` | Public | No | Dedicated marketing page for cafés and coffee shops | **VERIFIED_WORKING** |
| `/industries/salons` | Public | No | Dedicated marketing page for salons and barbershops | **VERIFIED_WORKING** |
| `/industries/retail` | Public | No | Planned retail landing page (missing from `App.tsx` switch) | **MISSING (P2)** |
| `/industries/gyms` | Public | No | Planned gym landing page (missing from `App.tsx` switch) | **MISSING (P2)** |
| `/industries/carwash` | Public | No | Planned car wash landing page (missing from `App.tsx` switch) | **MISSING (P2)** |
| `/login` | Public | No | Merchant portal login with quick-demo buttons | **VERIFIED_WORKING** |
| `/signup` | Public | No | Merchant registration with query-param pricing context | **VERIFIED_WORKING** |
| `/onboarding` | Public/Auth | Optional | 5-step business onboarding wizard | **VERIFIED_WORKING** |
| `/dashboard` | Authenticated | **Yes (Mock Guard)** | Business workspace shell (Overview, Loyalty, QR, CRM, etc.) | **VERIFIED_WORKING** |
| `/dashboard/kitchen` | Authenticated | **YES (MISSING GUARD)** | Kitchen Display System (KDS) fullscreen ticket interface | **BROKEN (P0)** |
| `/menu/:slug` | Public | No | Customer mobile digital menu with table context | **VERIFIED_WORKING** |
| `/order/:token` | Public | No | Customer live order status tracking page | **VERIFIED_WORKING (P1 leak)** |
| `/book/:slug` | Public | No | Customer 5-step salon appointment booking wizard | **VERIFIED_WORKING** |
| `/appointment/:token` | Public | No | Customer live appointment tracking page | **VERIFIED_WORKING** |
| `/catalog/:slug` | Public | No | Customer mobile digital retail lookbook & showcase | **VERIFIED_WORKING** |
| `/*` (Unmatched) | Public | No | Unmatched route fallback (currently falls back to `/`) | **MISSING 404 (P2)** |

---

## 6. Service and Data Model Inventory

| Service File | Storage Key | Data Entities Managed | Audit Findings |
|---|---|---|---|
| `mockAuthService.ts` | `loyalty_mock_auth_user`, `loyalty_onboarding_draft`, `loyalty_onboarding_completed` | `MockUser`, `OnboardingData` | Functional mock auth. Clean draft preservation across steps. |
| `mockBusinessService.ts` | `loyalty_active_business_id` | `MockBusiness`, `MockLocation`, `MockMetrics`, `MockActivity` | Manages 6 demo venues. `setActiveLocation` mutates in-memory object; resets on refresh. |
| `mockCafeService.ts` | `loyalty_mock_cafe_data_v1` | `MenuItem`, `MenuCategory`, `CafeTable`, `StandeeConfig` | Clean category/item CRUD, table creation, standee QR generation. |
| `mockOrderService.ts` | `loyalty_mock_orders_v1`, `loyalty_mock_order_idempotency_v1` | `Order`, `OrderItem`, `OrderStatusHistoryEntry` | Implements valid status transitions. Allows lookup by `orderNumber` (enumeration risk). |
| `mockSalonService.ts` | `loyalty_mock_salon_v1` | `SalonService`, `Stylist`, `SalonAppointment` | Conflict-free slot calculations. Sanitizes staff internal notes on public tracking. |
| `mockRetailService.ts` | `loyalty_mock_retail_v1` | `RetailProduct`, `RetailPurchaseRecord` | Inventory CRUD, in-store sale recording linked to CRM stamps. |
| `mockGymService.ts` | `loyalty_mock_gym_v1` | `GymPlan`, `GymMemberRecord`, `GymCheckInEvent`, `StudioClass` | Terminal check-in with duplicate and expiry prevention. Class capacity limits. |
| `mockCarWashService.ts` | `loyalty_mock_carwash_v1` | `CarWashService`, `CarWashBundle`, `CarWashCustomerPass` | Terminal pass redemption with cooldown guard and exhausted pass blocking. |
| `mockGenericService.ts` | `loyalty_mock_generic_service_v1` | `ServiceOffering`, `ServiceJobRecord` | Rate card management and job recording with loyalty stamp issuance. |
| `mockLoyaltyService.ts` | `loyalty_mock_loyalty_data_v1` | `CustomerRecord`, `LoyaltyProgram`, `LoyaltyEvent`, `QrCodeRecord` | Central CRM and QR Touchpoint source of truth. Staff PIN check in modal is weak. |
| `mockGrowthService.ts` | `loyalty_mock_growth_v1` | `Offer`, `CustomerSegment`, `CampaignRun`, `CustomerFeedback`, `TeamMember` | Multi-tab growth console, date-filtered analytics, safe CSV exporter. |

---

## 7. Business & Location Isolation Findings

1. **Service-Level Scoping:** Every service partitions data by `businessId` in storage schemas (`{ [businessId: string]: T }`).
2. **Cross-Workspace Data Leakage Audit:**
   - Switched between `biz_user_primary` (Coffee) and `biz_salon_demo` (Barbershop).
   - In CRM: Coffee has Sarah, David, Chloe; Barbershop has Marcus, Elena. **Zero leakage.**
   - In QR Studio: Coffee has 3 counter/menu QRs; Barbershop has reception QR. **Zero leakage.**
   - In Overview: Coffee displays restaurant operations card; Barbershop displays salon operations card. **Zero leakage.**
   - In KDS / Orders: Coffee orders do not appear in other workspaces. **Zero leakage.**
3. **Limitation:** In the mock implementation, isolation relies on client-side filtering. In production with Firebase, this must be strictly enforced via Firestore Security Rules (`resource.data.businessId == request.auth.token.businessId`).

---

## 8. Currency & Financial Calculation Integrity

1. **Integer Minor Units:** All financial fields throughout the platform are strictly stored as integer minor units (cents or paise):
   - Menu item base price: `425` ($4.25)
   - Retail product price: `2850` ($28.50)
   - Salon service price: `3500` ($35.00)
   - Gym plan price: `7900` ($79.00)
   - Offer minimum spend: `1500` ($15.00)
   - Order subtotals and totals: Minor-unit integers.
2. **Formatting Utility (`formatMinorUnits`):** Located in `src/types/cafe.ts` and reused across modules. Correctly formats `$X.XX` for USD and localized `₹X` / `₹X.XX` for INR.
3. **CSV Export Discrepancy:** `mockGrowthService.ts` hardcodes `$` in the discount column of the configured promotions table regardless of whether the business currency is `INR` or `USD` (`REQ-T9-10`).
4. **Analytics Estimation:** Gross transaction value for car wash passes and gym memberships uses flat multipliers ($35.00 and $59.00) rather than summing actual transaction receipts, because `CarWashCustomerPass` and `GymMemberRecord` lack purchase price fields (`REQ-T9-08`).

---

## 9. Mock Prototype vs. Production-Ready Capabilities

| Capability | Current Mock Implementation | Required Production Implementation (Task 10) |
|---|---|---|
| **Authentication** | Client `localStorage` session with mock profile. | Firebase Authentication with Email/Password & Google OAuth. |
| **Data Storage** | Browser `localStorage` (11 separate keys). | Google Cloud Firestore (Collections & Subcollections). |
| **Realtime Sync** | In-memory pub/sub listener array (`this.listeners`). | Firestore `onSnapshot()` realtime document listeners. |
| **Authorization** | Display-only Role-to-Permissions matrix. | Firebase Auth Custom Claims + Firestore Security Rules. |
| **File / Media Storage** | Unsplash image URLs & data URLs. | Firebase Storage with secure upload rules. |
| **Staff PIN Checks** | Client-side length comparison in modal. | Firebase Cloud Functions comparing hashed location PINs. |
| **Order Concurrency** | In-memory state machine. | Firestore Transactions with idempotency document locking. |
| **Campaign Messaging** | Local simulation badge in browser. | Cloud Functions triggering Twilio (SMS) / SendGrid (Email). |
| **Billing & Payments** | Frontend regional display status ($10/mo, ₹299/mo). | Stripe Customer Portal & Razorpay webhook integration. |

---

## 10. Security & Privacy Risks: Must Resolve Before Production

The following security issues must be resolved either prior to or during Task 10:

1. **Protect Kitchen Display System (`REQ-T6-11`, P0):** Add an authentication guard to `/dashboard/kitchen` immediately so unauthenticated guests cannot view active orders.
2. **Eliminate Order Enumeration (`REQ-T6-12`, P1):** Remove `orderNumber` and internal `id` lookups from `getOrderByTrackingToken()`. Allow access strictly via the unguessable `trackingToken`.
3. **Enforce Backend Role-Based Access Control (`REQ-T9-12`, P1):** Implement custom claims on Firebase tokens and enforce Firestore rules so that staff cannot access financial analytics or delete business configurations.
4. **Secure Staff PIN Hashing (`REQ-T4-02`, P1):** Never store or transmit location staff PINs in plaintext. Validate PINs inside trusted Cloud Functions.
5. **Sanitize User Input Rendering:** Ensure customer special instructions and feedback comments are sanitized against XSS before rendering in KDS and CRM displays.
6. **Deploy Production Domain in QR Studio:** Ensure default QR generation uses `https://loyaltydigitalqr.com` rather than `http://127.0.0.1:3000` when exporting physical assets.

---

## 11. Prioritized Remediation Plan Summary

- **P0-01 (Blocker):** Add missing authentication guard to `KitchenDisplayPage.tsx`.
- **P1-01 (High):** Restrict `getOrderByTrackingToken` to token-only lookup to prevent order enumeration.
- **P1-02 (High):** Enforce strict staff PIN equality in `StampIssuanceModal.tsx` and remove plaintext PIN helper.
- **P1-03 (High):** Implement backend RBAC rules in Firestore to back the existing role matrix.
- **P2-01 (Medium):** Wire missing industry landing routes (`/industries/retail`, `/industries/gyms`, etc.) in `App.tsx`.
- **P2-02 (Medium):** Add dedicated `NotFoundPage` 404 handler in `App.tsx` default route.
- **P2-03 (Medium):** Synchronize active dashboard view with URL search parameter (`/dashboard?view=analytics`).
- **P2-04 (Medium):** Persist multi-location selection in `localStorage` across page reloads.
- **P2-05 (Medium):** Add transaction price fields to gym members and car wash passes for exact gross value accounting.
- **P3-01 (Low):** Fix currency symbol in CSV export promotions table for Indian businesses.
- **P3-02 (Low):** Clean up React 19 compiler date purity warnings in `CampaignsAndOffersView.tsx`.

*(Refer to `audit/pre-firebase/PRE_FIREBASE_REMEDIATION_PLAN.md` for full implementation guidance.)*

---

## 12. Final Recommendation

### Assessment: CONDITIONALLY READY FOR TASK 10

The application has achieved an **89.81% verified completion rate** across 108 comprehensive requirements. All 9 automated test suites pass cleanly, `npm run build` compiles with zero errors, and static linting reports 0 errors.

The architectural separation between the presentation layer, mock services, and data models is remarkably clean, establishing well-defined integration boundaries for Firebase Authentication, Firestore collections, and Cloud Functions.

**Conditions for Proceeding to Task 10:**
1. Address **P0-01** (add auth guard to `/dashboard/kitchen`) and **P1-01** (restrict order tracking to tokens) as the immediate first steps of Task 10.
2. Proceed directly with Firebase package installation, Firebase configuration, Authentication setup, Firestore database rules, and repository migration as specified in the Task 10 roadmap.
