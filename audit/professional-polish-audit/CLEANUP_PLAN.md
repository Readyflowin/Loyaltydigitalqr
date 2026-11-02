# Loyaltydigitalqr — Cleanup & Remediation Plan

**Date:** 2026-11-01  
**Auditor:** Senior Software Engineer, Code-Quality Auditor & Product Reviewer  
**Repository:** `Loyaltydigitalqr`  
**Purpose:** Define a prioritized, staged, batch-by-batch execution plan for applying approved, non-breaking code and product polish improvements.

---

## 1. Safety Guarantees

Every modification in this plan complies with the non-negotiable safety rules:
- No features are removed or disabled.
- No architectural refactoring.
- No package updates.
- No database path or Firestore rule changes.
- Pre-existing staged user changes are strictly preserved.
- Verification (typecheck, lint, build) is executed after each batch.

---

## 2. Prioritized Execution Batches

### Batch 1: Safe Wording & Accidental AI/Sprint Artifact Cleanup

**Goal:** Remove accidental prompt leftovers and developer sprint task references from comments, types, and user-facing placeholder views.

1. **`src/pages/OnboardingPage.tsx`**
   - Clean line 468: `{/* STEP 2: BUSINESS DETAILS (Matching Image 4) */}` → `{/* Step 2: Business Details */}`
   - Clean line 520: `{/* Logo upload (matching screenshot in Image 4) */}` → `{/* Business logo upload */}`
   - Clean line 635: `{/* STEP 3: CHOOSE CUSTOMER REWARD (Matching Image 5) */}` → `{/* Step 3: Choose Customer Reward */}`
2. **`src/pages/SignupPage.tsx`**
   - Clean line 87: `{/* Value checklist matching screenshot */}` → `{/* Value checklist */}`
   - Clean line 110: `{/* Email Signup Form (Matching screenshot layout) */}` → `{/* Email signup form */}`
3. **`src/pages/HomePage.tsx`**
   - Clean line 56: `{/* Section F: Pricing Section REMOVED from homepage per Task 1 specifications */}` → `{/* Pricing plans available on dedicated /pricing routes */}`
4. **`src/types/loyalty.ts`**
   - Clean lines 2–3: Remove "Types for Task 4..." and "Task 10" references; replace with clean domain documentation.
5. **`src/components/dashboard/ModulePlaceholderView.tsx`**
   - Replace internal "Task 7/8/9" sprint task strings in `MODULE_DETAILS` with authentic roadmap labels (e.g. "Café Ordering & Kitchen Workflows", "Salon Bookings & Client Scheduling", "Staff Availability & Rosters", "Service Menu & Duration Engine", "Staff Management").
   - Update header badge to "UPCOMING MODULE · PRODUCT ROADMAP".

*Verification Check:* Run `npm run lint` and `npm run build`.

---

### Batch 2: User Interface & Product Language Consistency

**Goal:** Harmonize navigation labels, industry titles, and terminology across public and merchant pages.

1. **`src/components/dashboard/DashboardSidebar.tsx`**
   - Line 84: Capitalize `'Reviews & social'` → `'Reviews & Social'` to match other nav items.
   - Line 125: Update `'Record Service Event'` → `'Service Visits'` to match generic service view terminology.
2. **`src/components/common/Footer.tsx`**
   - Line 117: Harmonize `'Salons & Barbers'` → `'Salons & Barbershops'`.
3. **`src/pages/NotFoundPage.tsx`**
   - Lines 73, 79, 91, 97: Harmonize quick industry links with official titles:
     - `'Cafés & Coffee'` → `'Cafés & Coffee Shops'`
     - `'Salons & Barbers'` → `'Salons & Barbershops'`
     - `'Gyms & Fitness'` → `'Gyms & Fitness Studios'`
     - `'Car Wash'` → `'Car Wash & Auto Detailing'`
4. **`src/pages/LoginPage.tsx`**
   - Rename obsolete prototype variable `demoNotice` → `resetNotice` and format cleanly.

*Verification Check:* Run `npm run lint` and `npm run build`.

---

### Batch 3: Confirmed Unused-File & Template Remnant Cleanup

**Goal:** Safely remove confirmed unimported Vite template leftovers and dead components.

1. **`src/App.css`**
   - Delete unimported 184-line default Vite template file (verified 0 references).
2. **`src/assets/react.svg` & `src/assets/vite.svg`**
   - Delete unreferenced Vite starter SVG assets (verified 0 references).
3. **`src/components/sections/PricingSection.tsx`**
   - Remove abandoned 126-line component (verified 0 references; pricing was relocated to `/pricing`, `/pricing/usa`, `/pricing/india`).
4. **Protected Assets (Deliberately NOT Deleted):**
   - `src/assets/hero.png` (retained in Category 4)
   - `agsd.pdf` (retained in Category 4)
   - `public/reference-hero.png` (retained for layout regression tests)

*Verification Check:* Run `npm run lint` and `npm run build`.

---

### Batch 4: Code Maintainability & Formatting Improvements

**Goal:** Improve formatting of collapsed JSX blocks in key views (`LoginPage.tsx`, `TablePrintModal.tsx`, `PublicBookingPage.tsx`) where previously minified lines make future maintenance error-prone, without changing DOM hierarchy, props, or attributes.

1. Format `LoginPage.tsx` lines 75+ so the card JSX has clean indentation.
2. Format `TablePrintModal.tsx` acrylic card preview JSX.
3. Verify all JSX test IDs (`data-testid`) remain strictly unchanged.

*Verification Check:* Run `npm run lint` and `npm run build`.

---

### Batch 5: Final Comprehensive Verification & Deliverables

**Goal:** Execute full validation pipeline and compile audit report summary.

1. Run TypeScript check (`npm run build` runs `tsc -b && vite build`).
2. Run Oxlint check (`npm run lint`).
3. Run available Puppeteer verification scripts in `scripts/`.
4. Verify all 7 business engines (`cafe`, `restaurant`, `salon`, `retail`, `gym`, `carwash`, `service`) remain fully operational.
5. Verify authentication routes (`/login`, `/signup`, `/onboarding`, `/dashboard`) remain intact.
6. Verify public QR routes (`/card/:slug`, `/menu/:slug`, `/book/:slug`, `/catalog/:slug`, `/services/:slug`) remain intact.
7. Confirm git status preserves all original staged changes alongside our cleanups.
