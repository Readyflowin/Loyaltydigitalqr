# Loyaltydigitalqr — Pre-Firebase Remediation Plan
**Audit Checkpoint:** Final Checkpoint before Task 10 (Firebase Integration)

> [!IMPORTANT]
> This remediation plan identifies defects, security gaps, and architectural inconsistencies discovered during the pre-Firebase product audit of Tasks 1–9. **These repairs are recommendations only and must NOT be implemented during the audit task.** They should be executed prior to or during Task 10 as specified below.

---

## Priority Classification Summary

| Priority | Level | Description | Item Count | Target Phase |
|---|---|---|---|---|
| **P0** | **Critical Blocker** | Security vulnerabilities, data integrity risks, or unauthenticated route exposure | 1 | Fix Immediately / Prior to Task 10 |
| **P1** | **High Priority** | Broken authorization designs, enumeration risks, and weak validation guards | 3 | Fix at Start of Task 10 |
| **P2** | **Medium Priority** | Missing routes, UX state resets, unmodeled financial fields, and 404 fallbacks | 5 | Implement in Task 10 Feature Work |
| **P3** | **Low / Polish** | Minor formatting bugs, non-blocking linter warnings, and cosmetic labels | 2 | Clean up during Task 10 Polish |

---

## 1. P0 — Critical Blockers (Must Fix Immediately)

### Item P0-01: Missing Authentication Guard on Kitchen Display System (`/dashboard/kitchen`)
- **Requirement ID Affected:** `REQ-T6-11`
- **Source File:** `src/pages/KitchenDisplayPage.tsx`
- **Evidence:** 
  Lines 30–50 of `KitchenDisplayPage.tsx` instantiate `activeBusiness` and subscribe to `mockOrderService`, but completely omit any check for `mockAuthService.getCurrentUser()`. An unauthenticated visitor navigating directly to `http://127.0.0.1:3000/dashboard/kitchen` can view real-time orders, table numbers, and customer names without logging in.
- **Consequence:** In production, exposing the KDS URL would allow anyone to view live restaurant kitchen orders, guest names, table numbers, and change preparation statuses.
- **Recommended Fix:** 
  1. Add an auth check in `KitchenDisplayPage.tsx` matching `DashboardPage.tsx`:
     ```tsx
     useEffect(() => {
       const user = mockAuthService.getCurrentUser();
       if (!user) {
         navigate('/login?redirect=/dashboard/kitchen');
       }
     }, [navigate]);
     ```
  2. In Task 10, protect the route with Firebase Auth state observer and enforce Firestore Security Rules requiring authenticated staff claims for reading `/businesses/{bizId}/orders`.
- **Verification Method:** Navigate to `http://127.0.0.1:3000/dashboard/kitchen` in an incognito Puppeteer browser with empty localStorage. Assert that the browser is redirected to `/login?redirect=/dashboard/kitchen`.

---

## 2. P1 — High Priority (Fix at Start of Task 10)

### Item P1-01: Order Lookup by `orderNumber` Enables Order Enumeration
- **Requirement ID Affected:** `REQ-T6-12`
- **Source File:** `src/services/mockOrderService.ts` (lines 353–360)
- **Evidence:**
  ```typescript
  getOrderByTrackingToken(tokenOrId: string): Order | null {
    const data = this.loadData();
    for (const bizId of Object.keys(data)) {
      const found = data[bizId].find(
        (o) => o.trackingToken === tokenOrId || o.id === tokenOrId || o.orderNumber === tokenOrId
      );
      if (found) return found;
    }
    return null;
  }
  ```
- **Consequence:** Customers can guess sequential order numbers (`#1040`, `#1041`, `#1042`) or internal IDs in the URL `/order/#1041`, exposing other customers' full order receipts, item customizations, and table locations.
- **Recommended Fix:** Restrict public order tracking strictly to the unguessable cryptographic token (`o.trackingToken === tokenOrId`). Disallow lookup by `orderNumber` or internal `id` on public tracking endpoints.
- **Verification Method:** Test navigating to `/order/%231041` and assert that the tracking page displays an `"Order Not Found"` error state rather than loading the order.

### Item P1-02: Staff PIN Stamp Issuance Checks Length Only, Not Location PIN
- **Requirement ID Affected:** `REQ-T4-02`
- **Source File:** `src/components/dashboard/loyalty/StampIssuanceModal.tsx` (lines 55–60)
- **Evidence:**
  ```typescript
  if (!staffPin || staffPin.trim().length < 4) {
    setErrorMsg('Please provide a valid 4-digit staff PIN.');
    return;
  }
  ```
  The code verifies only that 4 characters were entered. Entering any arbitrary PIN (e.g., `9999`) succeeds. Furthermore, line 248 displays `"Use Counter PIN ({defaultStaffPin})"`, revealing the PIN right on the UI.
- **Consequence:** Any user or customer who gains access to the screen can enter any 4 digits or click the helper button to issue arbitrary loyalty stamps without authorization.
- **Recommended Fix:** 
  1. Verify `staffPin.trim() === defaultStaffPin`.
  2. Remove the plaintext counter PIN helper button from the modal.
  3. In Task 10, execute stamp issuance via a trusted Firebase Cloud Function that validates a hashed staff PIN or caller's Firebase Auth claim.
- **Verification Method:** In Puppeteer, enter `0000` when the location PIN is `4821`. Assert that the modal rejects the submission with `"Invalid staff validation PIN"`.

### Item P1-03: Client-Side Role Matrix is Decorative (No RBAC on Mutations)
- **Requirement ID Affected:** `REQ-T9-12`
- **Source File:** `src/components/dashboard/SettingsView.tsx`, all dashboard views
- **Evidence:**
  `mockGrowthService.hasPermission()` is called only to render checkmarks in the Settings view table. Nowhere in `CafeMenuView`, `LoyaltyProgramView`, `SalonServicesView`, or `mockGrowthService.ts` is the active user's role checked before creating items, issuing stamps, modifying settings, or deleting records.
- **Consequence:** In the current prototype, any logged-in user has unrestricted administrative access to all business features, financial analytics, and customer data.
- **Recommended Fix:** In Task 10, attach custom user claims (`role: 'owner' | 'manager' | 'staff' | 'receptionist'`) to Firebase Auth tokens and enforce Firestore Security Rules restricting write operations to authorized roles.
- **Verification Method:** Sign in as a user with `role: 'staff'`. Assert that settings modification and financial gross value queries are rejected by Firestore security rules.

---

## 3. P2 — Medium Priority (Implement in Task 10 Feature Work)

### Item P2-01: Missing Public Landing Routes for Retail, Gyms, Car Wash, and Restaurants
- **Requirement ID Affected:** `REQ-T1-11`
- **Source File:** `src/App.tsx` (lines 171–185)
- **Evidence:** `INDUSTRIES_DATA` in `src/data/industriesData.ts` defines data for 6 industries, but `App.tsx` only handles `/industries/cafes` and `/industries/salons`. Visiting `/industries/retail`, `/industries/gyms`, or `/industries/carwash` falls through to `HomePage`.
- **Consequence:** Public marketing campaigns targeting retail boutiques, gyms, or car washes cannot land on dedicated industry showcases.
- **Recommended Fix:** Add route cases in `App.tsx` for `/industries/retail`, `/industries/gyms`, `/industries/carwash`, and `/industries/restaurants`, rendering `IndustryLandingPage` with the matching industry ID.
- **Verification Method:** Navigate to `/industries/retail` in Puppeteer. Assert that the page title is `"Retail & Boutiques Loyalty — Loyaltydigitalqr"` and displays retail benefits.

### Item P2-02: Missing Dedicated 404 Not Found Route Handler
- **Requirement ID Affected:** `REQ-XC-01`
- **Source File:** `src/App.tsx` (switch statement default case)
- **Evidence:** The switch statement in `renderRoute()` falls through to `default: return <HomePage ... />`.
- **Consequence:** Users navigating to broken or mistyped URLs (e.g. `/unknown-page`) are shown the homepage without any indication that the requested page does not exist.
- **Recommended Fix:** Create a dedicated `NotFoundPage` component with a clear 404 message and a `"Return to Homepage"` button, and render it in `App.tsx` default case.
- **Verification Method:** Navigate to `/invalid-test-url-404`. Assert that the DOM renders the 404 error heading and status code.

### Item P2-03: Dashboard Sub-Views Reset to Overview on Page Refresh (No Deep Linking)
- **Requirement ID Affected:** `REQ-XC-02`
- **Source File:** `src/pages/DashboardPage.tsx` (line 98)
- **Evidence:** `const [activeView, setActiveView] = useState<string>('overview');` is in-memory only.
- **Consequence:** Merchants cannot bookmark or share links to specific dashboard tabs (e.g., Analytics or QR Studio). Refreshing the page while working on offers or menu items abruptly resets the screen to the Overview tab.
- **Recommended Fix:** Read `activeView` from URL query parameter (e.g. `/dashboard?view=analytics`) or support path-based sub-routes (`/dashboard/analytics`), updating the URL via `navigate('/dashboard?view=' + viewId, { replace: true })`.
- **Verification Method:** Navigate to `/dashboard?view=analytics`, refresh the page, and assert that `AnalyticsView` remains rendered.

### Item P2-04: Multi-Location Selection Resets on Refresh (Ephemeral In-Memory Mutation)
- **Requirement ID Affected:** `REQ-T3-07`
- **Source File:** `src/services/mockBusinessService.ts` (lines 301–308)
- **Evidence:** `setActiveLocation` mutates `biz.activeLocationId` on an ephemeral object produced by `this.getInitialBusinesses()`, without writing to `localStorage`.
- **Consequence:** Location switching does not survive browser refresh or navigation between views.
- **Recommended Fix:** Store `activeLocationId` in `localStorage` under `loyalty_active_location_id` and persist it to user preferences in Firestore in Task 10.
- **Verification Method:** Switch active location to `"Terminal 2 Concourse"`, reload the page, and assert that `activeBusiness.activeLocationId` remains `'loc_express'`.

### Item P2-05: Missing Transaction Price on Passes & Memberships (Analytics Estimation)
- **Requirement ID Affected:** `REQ-T9-08`
- **Source File:** `src/services/mockGrowthService.ts` (lines 115–125), `src/types/carwash.ts`, `src/types/gym.ts`
- **Evidence:** `CarWashCustomerPass` and `GymMemberRecord` lack purchase price fields, forcing `mockGrowthService.ts` to estimate gross transaction value using flat multipliers ($35.00 and $59.00).
- **Consequence:** Analytics gross value metrics for gyms and car washes are approximations rather than exact financial summaries.
- **Recommended Fix:** Add `pricePaidMinor: number` and `purchasedAt: string` to `CarWashCustomerPass` and `GymMemberRecord`. Compute gross value strictly by summing actual recorded purchase prices.
- **Verification Method:** Record a pass purchase of $42.00, check `getGrowthAnalytics()`, and assert that recorded gross value increases by exactly $42.00.

---

## 4. P3 — Low Priority / Polish (Clean Up During Task 10)

### Item P3-01: CSV Export Hardcodes "$" in Promotions Table
- **Requirement ID Affected:** `REQ-T9-10`
- **Source File:** `src/services/mockGrowthService.ts` (line 175)
- **Evidence:** `const discountLabel = o.offerType === 'percentage' ? `${o.discountValue}%` : `$${(o.discountValue / 100).toFixed(2)}`;`
- **Consequence:** Indian businesses with currency `INR` will see `$` in the discount column of the generated CSV report instead of `₹`.
- **Recommended Fix:** Use `business?.currencySymbol || '$'` instead of a literal `$` string.
- **Verification Method:** Export analytics CSV for an Indian business with a fixed ₹50 discount offer. Assert that the CSV text contains `"₹50.00"`.

### Item P3-02: React 19 Compiler Impure Date Warnings in Campaigns View
- **Requirement ID Affected:** Code Quality / Lint
- **Source File:** `src/components/dashboard/growth/CampaignsAndOffersView.tsx` (lines 63, 65, 282, 470)
- **Evidence:** `oxlint` reports 5 `react(purity)` warnings for calling `new Date()` or `Date.now()` during component render.
- **Consequence:** Non-fatal, but causes React 19 compiler to skip rendering optimizations.
- **Recommended Fix:** Wrap initial date calculations in `useMemo` or initialize them inside state initializer functions.
- **Verification Method:** Run `npm run lint` and assert 0 warnings from `CampaignsAndOffersView.tsx`.
