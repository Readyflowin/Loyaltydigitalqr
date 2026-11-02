# Loyaltydigitalqr — Preservation Report

**Date:** 2026-11-01  
**Auditor:** Senior Software Engineer, Code-Quality Auditor & Product Reviewer  
**Repository:** `Loyaltydigitalqr`  
**Purpose:** Explicitly record all critical architectural foundations, business engine logic, security validations, active integrations, configuration files, and documentation that were inspected and **deliberately preserved** during the professional polish audit.

---

## 1. Non-Negotiable Safety Invariants

In strict adherence to **PART 1 & PART 3** of the audit requirements, the following systems and assets have been verified and protected from alteration or deletion.

---

## 2. Business Engine Identifiers & Industry Workflows

All seven internal business engine identifiers and their associated service operations, data models, and user interfaces are strictly preserved:

| Engine Identifier | Domain Coverage | Core Service | Main UI Components & Pages | Status |
|---|---|---|---|---|
| `cafe` | Menu categories, items, dietary tags, table standees, KDS, customer table QR | `cafeService.ts`, `orderService.ts` | `CafeMenuView.tsx`, `CafeOrdersView.tsx`, `CafeTablesView.tsx`, `MenuEditModal.tsx`, `MenuItemEditModal.tsx`, `TableEditModal.tsx`, `TablePrintModal.tsx`, `PublicMenuPage.tsx`, `KitchenDisplayPage.tsx` | **PRESERVED** |
| `restaurant` | Food & beverage dining, table ordering, kitchen ticket prep, bills | `cafeService.ts`, `orderService.ts` | Shared food service engine, tables, KDS, public menu ordering | **PRESERVED** |
| `salon` | Stylist profiles, chair stations, appointment booking, time-slot scheduling | `salonService.ts` | `SalonAppointmentsView.tsx`, `SalonCalendarView.tsx`, `SalonServicesView.tsx`, `SalonStaffView.tsx`, `PublicBookingPage.tsx`, `PublicAppointmentTrackingPage.tsx` | **PRESERVED** |
| `retail` | Product catalogue, lookbooks, sizes/colors, in-store sales tracking | `retailService.ts` | `RetailCatalogueView.tsx`, `PublicCatalogPage.tsx` | **PRESERVED** |
| `gym` | Memberships, visit check-in terminal, studio classes, capacity limits | `gymService.ts` | `GymMembersView.tsx`, `GymCheckInView.tsx`, `GymClassesView.tsx` | **PRESERVED** |
| `carwash` | Wash tiers, prepaid multi-wash passes, lane redemption terminal | `carWashService.ts` | `CarWashServicesView.tsx`, `CarWashBundlesView.tsx`, `CarWashVisitsView.tsx` | **PRESERVED** |
| `service` | Generic services, job records, completion tracking, loyalty issuance | `genericService.ts` | `GenericServicesView.tsx`, `GenericVisitView.tsx`, `PublicServicesPage.tsx` | **PRESERVED** |

---

## 3. Security, Authentication & Data Protection

Every security boundary, authorization check, cryptographic routine, and isolation mechanism was examined and preserved:

1. **Staff PIN Verification:**
   - Preserved in `loyaltyService.ts` (`issueStampWithPin`, `redeemRewardWithPin`), `salonService.ts`, `carWashService.ts`, `gymService.ts`, and `genericService.ts`.
   - Never weakened or bypassed.
2. **Firestore Security Rules (`firestore.rules`):**
   - Collection-level authorization rules governing `businesses/{id}`, sub-collections (`customers`, `orders`, `appointments`, `menus`, etc.), and public mirror collections (`publicProfiles`, `slugs`) are untouched.
   - Ownership, manager, and member role checks remain enforced.
3. **Firestore Composite Indexes (`firestore.indexes.json`):**
   - Single-field collection group exemptions (e.g. `invites.email`) and composite queries preserved for live querying.
4. **Cloudflare Worker Security (`worker/src/index.ts` & `worker/wrangler.toml`):**
   - Firebase JWT verification via Google JWKS (`jose`).
   - Firestore token verification ensuring only business members can upload image assets.
   - Strict CORS origin validation against configured allowed origins (`ALLOWED_ORIGINS`).
   - File size limits (5 MB) and MIME-type white-listing (`image/png`, `image/jpeg`, `image/webp`, `image/gif`).
5. **Vercel Serverless Function & Vite Middleware (`api/upload.ts` & `api/_r2-upload.ts`):**
   - Shared server-side R2 upload implementation using AWS S3 signatures (`aws4fetch`) and Google JWKS validation without exposing secrets to client-side code.
6. **Customer Anti-Duplication & Transaction Integrity:**
   - Unique phone and email reservations (`reserveCustomerContacts`, `releaseCustomerContacts`) in `loyaltyService.ts` to prevent duplicate loyalty sign-ups.
   - Minor currency integer units (cents/paise) throughout to prevent floating-point calculation errors.

---

## 4. Pre-Existing Uncommitted User Changes (Git Staged)

The user has 34 staged files in Git containing active feature implementations:
- `src/components/public/SocialLinksBar.tsx` (new component)
- `src/components/public/ExperienceModal.tsx` (new component)
- `src/utils/socialUrls.ts` (new utility)
- `src/App.tsx` (lazy route splitting and Suspense boundaries)
- `vite.config.ts` (optimized manual chunk splitting for `firebase`, `react-vendor`, and `ui`)
- Staged refinements in public pages and modal components.

**These changes have been strictly preserved and will not be overwritten, discarded, or unstaged.**

---

## 5. Architectural Infrastructure

The reactive data synchronization layer that bridges synchronous service consumption with Firestore real-time snapshots is fully preserved:
- `src/lib/bizStore.ts`: Business-scoped cache, write diffing, subcollection listeners, mirror projection logic.
- `src/lib/firebase.ts`: Firebase app initialization, Firestore instance, Auth instance, and emulator detection.
- `src/router/`: Custom lightweight client-side router (`Router.tsx`, `RouterContext.ts`, `index.ts`).

---

## 6. Project History, Audit Reports & Testing Infrastructure

The following historical documents and test assets are preserved:
1. `audit/independent-readonly-audit/`:
   - `CODE_AND_SERVICE_INVENTORY.md`
   - `EXECUTIVE_AUDIT_REPORT.md`
   - `FIREBASE_READINESS_REPORT.md`
   - `PRIORITIZED_IMPROVEMENT_BACKLOG.md`
   - `SECURITY_AND_DATA_ISOLATION_REPORT.md`
   - `TEST_EXECUTION_REPORT.md`
2. `audit/onboarding-social-branches-audit/`:
   - `ANTIGRAVITY_PROMPTS.md`
   - `AUDIT_EXECUTION_REPORT.md`
   - `FIREBASE_AND_DATA_MODEL_IMPACT.md`
   - `IMPLEMENTATION_BLUEPRINT.md`
   - `ONBOARDING_AND_DASHBOARD_AUDIT.md`
   - `RECOMMENDED_IMPLEMENTATION_PLAN.md`
   - `SOCIAL_LINKS_AND_BRANCH_AUDIT.md`
3. `audit/pre-firebase/`:
   - `PRE_FIREBASE_AUDIT_REPORT.md`
   - `PRE_FIREBASE_REMEDIATION_PLAN.md`
   - `REMEDIATION_REPORT.md`
   - `TEST_EXECUTION_LOG.md`
4. `audit/design/` & `audit/design-snapshots/`:
   - Visual audit reports and snapshot regression baselines.
5. `scripts/`:
   - Puppeteer test suites: `test-task1-verification.js` through `test-task9-verification.js`, `test-remediation-verification.js`, `test-responsive.js`, `inspect-layout.js`, `compare-hero.js`.
6. Ambiguous root files deliberately retained:
   - `agsd.pdf` (Category 4 item — not deleted to avoid data loss).
   - `src/assets/hero.png` (Category 4 item — retained).
