# CODEBASE AND SERVICE ARCHITECTURE INVENTORY
**Project:** Loyaltydigitalqr  
**Audit Scope:** Deep Structural, Technical & Dependency Inventory  
**Auditor:** Senior Principal Full-Stack & Software Architect (Antigravity Autonomous Pair Programmer)  
**Date of Audit:** October 31, 2026  
**Deliverable Path:** `audit/independent-readonly-audit/CODE_AND_SERVICE_INVENTORY.md`  

---

## 1. Architectural Overview & System Map

Loyaltydigitalqr is a multi-industry business operating system and customer retention SaaS platform. The application is constructed on a modern Single-Page Application (SPA) architecture:

- **Frontend Core:** React 19.3.1, TypeScript 6.0.3, Vite 8.3.5, Tailwind CSS 4.3.3.
- **Client Routing:** Custom client-side router (`src/router/`) providing lightweight path normalization, query parameter synchronization, and programmatic navigation without external router dependencies.
- **Backend Infrastructure:** Firebase Auth (v12.19.0), Cloud Firestore, Firebase Hosting, Cloudflare Workers (R2 Bucket image upload).
- **Client Data Synchronization Layer:** A bespoke reactive in-memory cache and diffing store (`bizStore.ts`) that listens to Firestore subcollections via `onSnapshot` and exposes synchronous getter/setter methods to legacy UI components.

```
Loyaltydigitalqr Root
├── .env / .env.example              # Firebase web configuration & public origin
├── firebase.json / .firebaserc      # Firebase Hosting & Emulator configuration
├── firestore.rules                  # Production Firestore Security Rules (RBAC)
├── firestore.indexes.json           # Composite & collection-group query indexes
├── worker/                          # Cloudflare Worker for authenticated R2 image uploads
│   ├── src/index.ts                 # Firebase JWT verification & R2 upload endpoint
│   └── wrangler.toml                # Worker configuration & bucket binding
├── scripts/                         # 24 custom Puppeteer & inspection scripts
└── src/
    ├── assets/                      # Icons and static brand assets
    ├── components/
    │   ├── auth/                    # VerifyEmailScreen, auth guards
    │   ├── common/                  # Header, Footer, Logo, ThemeToggle
    │   ├── dashboard/               # Sidebar, Header, Overview, Settings
    │   │   ├── cafe/                # CafeMenuView, CafeOrdersView, CafeTablesView
    │   │   ├── salon/               # SalonServicesView, SalonStaffView, SalonAppointmentsView, SalonCalendarView
    │   │   ├── retail/              # RetailCatalogueView, RetailTerminalModal
    │   │   ├── gym/                 # GymMembersView, GymCheckInView, GymClassesView
    │   │   ├── carwash/             # CarWashServicesView, CarWashBundlesView, CarWashVisitsView
    │   │   ├── service/             # GenericServicesView, GenericVisitView
    │   │   ├── loyalty/             # LoyaltyProgramView, StampIssuanceModal
    │   │   ├── customers/           # CustomerCrmView, CustomerProfileDrawer, RewardRedemptionModal
    │   │   ├── qr/                  # QrStudioView, QR Standee generator
    │   │   └── growth/              # AnalyticsView, CampaignsAndOffersView, CustomerFeedbackView
    │   ├── hero/ / sections/        # Homepage landing sections
    │   ├── modals/                  # CardBuilderModal, VideoDemoModal, RewardDetailModal
    │   ├── onboarding/              # LoyaltyCardPreview
    │   ├── public/                  # PublicBusinessGate (public data loader)
    │   └── ui/                      # Shared design tokens: Button, Input, Modal, StatCard, LoyaltyCard
    ├── data/                        # Static metadata (industries, themes, FAQ, stores)
    ├── lib/                         # Core infrastructure: firebase.ts, bizStore.ts, ids.ts, actor.ts, uploads.ts
    ├── pages/                       # 17 top-level route pages (Marketing, Auth, Dashboard, Public)
    ├── router/                      # Custom router context, provider, and Link component
    ├── services/                    # 11 domain service modules
    ├── types/                       # 13 TypeScript domain type definitions
    └── utils/                       # salonScheduling, dates, qrUrlBuilder
```

---

## 2. Comprehensive Service Architecture Inventory

The table below catalogs all 11 core domain services in `src/services/`, detailing their data contracts, storage mechanisms, and operational behaviors:

### Summary Matrix
| Service | Primary Domain | Storage Mechanism | Firestore Collections Read/Written | Public Access Exposure | Side Effects & Listeners |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`authService.ts`** | Identity & Session | Firebase Auth + `users` collection | Reads/Writes `users/{uid}` | Public sign-in / signup | Notifies `listeners` on auth state changes; triggers `ensureFreshToken()` |
| **`businessService.ts`** | Workspaces & Team | Firestore + `bizStore` | `businesses/{id}`, `publicProfiles/{id}`, `slugs/{slug}`, `invites/{email}` | Public profiles & slugs readable by guests | Maintains `ACTIVE_BIZ_KEY` in localStorage; handles team invitations |
| **`cafeService.ts`** | Cafe & Restaurant | Firestore via `bizStore` | `menus`, `menuCategories`, `menuItems`, `tables` | Read by everyone; written by managers | Notifies UI subscribers on menu/category changes |
| **`orderService.ts`** | Orders & KDS | Firestore via `bizStore` | `orders` subcollection | Single order read by unguessable token | Computes live KDS wait times; maintains client idempotency keys |
| **`salonService.ts`** | Salon Booking | Firestore via `bizStore` | `salonServices`, `salonStaff`, `appointments`, `appointmentSlots` | Services, staff & slots public; appointments private | Projects unredacted appointments to public `appointmentSlots` |
| **`retailService.ts`** | Retail Boutique | Firestore via `bizStore` | `retailCategories`, `retailProducts`, `retailPurchases` | Categories & products public; purchases private | Records in-store purchase records; triggers loyalty stamp issuance |
| **`gymService.ts`** | Gym & Fitness | Firestore via `bizStore` | `gymPlans`, `gymMembers`, `gymCheckIns`, `gymClasses` | Private (Members only) | Decrements member visit balances; enforces check-in cooldowns |
| **`carWashService.ts`** | Car Wash Tunnel | Firestore via `bizStore` | `carwashServices`, `carwashBundles`, `carwashPasses`, `carwashVisits` | Private (Members only) | Redeems wash passes; enforces license plate cooldown timers |
| **`genericService.ts`** | Generic Repair/Trade | Firestore via `bizStore` | `serviceItems`, `serviceJobs` | Private (Members only) | Tracks service job tickets; links customer loyalty |
| **`loyaltyService.ts`** | Loyalty & CRM | Firestore via `bizStore` | `config/loyaltyProgram`, `customers`, `customerPhones`, `memberCards`, `loyaltyEvents`, `qrCodes` | `loyaltyProgram` & `memberCards` public; full customer CRM private | Issues visit stamps; generates `REW-XXXXX` vouchers; maintains phone uniqueness |
| **`growthService.ts`** | Growth & Analytics | Firestore via `bizStore` | `offers`, `offerRedemptions`, `segments`, `campaignRuns`, `feedbacks`, `config/feedback` | Feedback submission public; offers & analytics private | Aggregates truthful gross transaction revenue; exports RFC 4180 CSV |

---

## 3. Deep Dive: Service by Service Analysis

### 1. `authService.ts`
- **Purpose:** Manages merchant authentication, identity lifecycle, session restoration, email verification gating, password reset, and onboarding drafts.
- **Main Methods:** `init()`, `getCurrentUser()`, `signInWithGoogle()`, `signInWithEmail()`, `signUpWithEmail()`, `resendVerificationEmail()`, `reloadUser()`, `ensureFreshToken()`, `signOut()`, `getOnboardingDraft()`, `saveOnboardingDraft()`.
- **Storage:** Firebase Auth SDK persistence + Firestore `users/{uid}` profile document + `localStorage` for pre-workspace onboarding drafts (`loyalty_onboarding_draft_{uid}`).
- **Business Isolation:** Global identity layer. Users can own or belong to multiple business workspaces via `memberUids`.
- **Validation:** Enforces password minimum 8 characters; validates email format; handles 12 distinct Firebase Auth error codes.
- **Limitations:** Does not support multi-factor authentication (MFA); password reset does not confirm delivery client-side.

### 2. `businessService.ts`
- **Purpose:** Manages business workspaces, multi-location configuration, owner and staff roles, slug reservations, and team invitations.
- **Main Methods:** `getAllBusinesses()`, `getActiveBusiness()`, `setActiveBusiness()`, `createBusiness()`, `updateBusiness()`, `inviteMember()`, `acceptInvite()`, `revokeInvite()`, `loadPublicBusiness()`, `verifyStaffPin()`, `getMetrics()`, `getActivities()`, `getChecklist()`.
- **Storage:** Firestore root collection `businesses/{bizId}`, `publicProfiles/{bizId}`, `slugs/{slug}`, and subcollection `businesses/{bizId}/invites/{email}`. Active business and active locations are stored in browser `localStorage`.
- **Business Isolation:** Strict. `getAllBusinesses()` queries Firestore `where('memberUids', 'array-contains', uid)`. Users only receive documents for workspaces where they hold verified membership.
- **Critical Flaw:** `verifyStaffPin` compares entered PIN against plaintext `location.staffPin` stored on the business document. All members receive these PINs in memory.

### 3. `bizStore.ts` (Core Synchronization Layer)
- **Purpose:** Bridges synchronous component reads with asynchronous Firestore listeners and batch commits.
- **Main Methods:** `register()`, `attach()`, `detach()`, `getBundle()`, `getAll()`, `save()`, `saveAll()`, `pinDoc()`, `isReady()`, `subscribe()`, `onError()`.
- **Mechanism:** When a business attaches, `bizStore` opens Firestore `onSnapshot` listeners on registered subcollections. In-memory Maps store the parsed JSON documents. `getBundle()` returns the in-memory cache synchronously. When `save()` is invoked, changed documents are diffed against the cache and written to Firestore using asynchronous `writeBatch()` chunks (max 400 operations per batch).
- **Strengths:** Eliminates asynchronous prop-drilling; preserves instant UI responsiveness; provides offline IndexedDB caching.
- **Weaknesses:**
  - Loads entire subcollections (e.g. all customers) into memory without cursor pagination.
  - If a batch write fails (e.g. permission-denied), in-memory cache is **not rolled back**, leading to silent optimistic UI desynchronization until page refresh.

### 4. `loyaltyService.ts`
- **Purpose:** Controls loyalty program rules, customer CRM profiles, atomic stamp issuance, reward voucher generation, and QR studio standees.
- **Main Methods:** `getProgram()`, `saveProgram()`, `getCustomers()`, `addCustomer()`, `selfEnroll()`, `updateCustomer()`, `archiveCustomer()`, `issueStamp()`, `redeemReward()`, `createQrCode()`, `getComputedMetrics()`.
- **Storage:** Firestore subcollections: `config/loyaltyProgram`, `customers`, `customerPhones`, `memberCards`, `loyaltyEvents`, `qrCodes`.
- **Stamp & Reward Rules:**
  - Upon reaching `stampsRequired`, unlocks a `CustomerReward` with crypto-random voucher code `REW-XXXXX`.
  - Stamps cycle with modulo arithmetic (`totalNewStamps % required`), carrying overflow stamps into the next reward cycle.
  - Generates immutable `loyaltyEvents` for audits.
- **Flaw:** `issueStamp` and `redeemReward` bypass PIN verification if `staffPin` is omitted or empty.

### 5. `orderService.ts`
- **Purpose:** Handles café and restaurant digital orders, table dine-in assignments, KDS kitchen queue management, and live order status tracking.
- **Main Methods:** `getOrders()`, `getOrder()`, `getOrderByTrackingToken()`, `createOrder()`, `updateOrderStatus()`, `cancelOrder()`, `watchOrder()`.
- **Storage:** Firestore subcollection `businesses/{bizId}/orders/{orderId}`.
- **Security & Entropy:** Order documents use 32-character crypto-random IDs (`${newId()}${newId()}`). Tracking links look like `/order/{bizId}.{orderId}`. Guest lookups by sequential number (`#1040`) are strictly rejected with 404.
- **Currency:** All item base prices, variant adjustments, modifier additions, subtotals, and totals are computed strictly in **integer minor currency units** (cents / paise) to eliminate JavaScript IEEE-754 floating-point errors.

### 6. `salonService.ts`
- **Purpose:** Manages salon service catalog, staff working schedules, conflict-free slot calculation, public booking, and merchant calendar.
- **Main Methods:** `getServices()`, `getStaff()`, `getAppointments()`, `getPublicBookingProfile()`, `createAppointment()`, `updateAppointmentStatus()`, `cancelAppointment()`.
- **Storage:** Firestore subcollections: `salonServices`, `salonStaff`, `appointments`, and public projection `appointmentSlots`.
- **Public Projection Security:** When an appointment is created, a sanitized mirror is written to `appointmentSlots` containing only `staffId`, `startIso`, `endIso`, `status`, and service buffer durations. Customer names, phones, emails, and notes are never exposed on public slot queries.
- **Limitation:** Slot availability is evaluated client-side. Simultaneous bookings by two customers for the same slot can race without a backend Firestore Transaction.

### 7. `growthService.ts`
- **Purpose:** Powers promotional offers, customer segmentation, simulated win-back campaigns, customer feedback collection, and truthful analytics.
- **Main Methods:** `getOffers()`, `createOffer()`, `redeemOffer()`, `evaluateAudience()`, `simulateWinBackCampaign()`, `submitFeedback()`, `getGrowthAnalytics()`, `exportAnalyticsCsv()`.
- **Data Integrity Highlight:**
  - **Zero Invented Metrics:** `getGrowthAnalytics()` aggregates gross revenue strictly from recorded orders, salon bookings, retail sales, and service jobs. Unpriced gym passes and car wash bundles contribute 0 without invented estimates.
  - **RFC 4180 CSV Export:** Properly escapes double quotes, wraps strings in quotes, and strips formula injection characters (`=`, `+`, `-`, `@`).

---

## 4. Component-to-Service Dependency Map

The following table documents direct dependencies between top-level UI components and domain services:

| Component / Page | File Path | Direct Service Dependencies | Synchronization Pattern |
| :--- | :--- | :--- | :--- |
| `App.tsx` | `src/App.tsx` | `orderService`, `salonService` | Token parsing for public route gates |
| `Header.tsx` | `src/components/common/Header.tsx` | Router (`useRouter`) | Path matching and anchor scrolling |
| `Footer.tsx` | `src/components/common/Footer.tsx` | Router (`useRouter`) | Anchor scrolling & theme toggle |
| `LoginPage.tsx` | `src/pages/LoginPage.tsx` | `authService` | Async signInWithGoogle / signInWithEmail |
| `SignupPage.tsx` | `src/pages/SignupPage.tsx` | `authService` | Async signUpWithEmail / onboarding draft |
| `OnboardingPage.tsx` | `src/pages/OnboardingPage.tsx` | `authService`, `businessService` | Draft autosave & async createBusiness |
| `DashboardPage.tsx` | `src/pages/DashboardPage.tsx` | `authService`, `businessService`, `bizStore` | Session gate, reactive subscription, view switcher |
| `KitchenDisplayPage.tsx` | `src/pages/KitchenDisplayPage.tsx` | `authService`, `businessService`, `orderService`, `bizStore` | Live order subscription & status updates |
| `OverviewView.tsx` | `src/components/dashboard/OverviewView.tsx` | `businessService`, `loyaltyService` | Reactive metrics, activity stream, checklist |
| `SettingsView.tsx` | `src/components/dashboard/SettingsView.tsx` | `businessService`, `authService`, `uploads` | Profile editing, multi-location, team invites, logo upload |
| `LoyaltyProgramView.tsx` | `src/components/dashboard/loyalty/LoyaltyProgramView.tsx` | `loyaltyService` | Program configuration & audit events |
| `CustomerCrmView.tsx` | `src/components/dashboard/customers/CustomerCrmView.tsx` | `loyaltyService` | Customer search, filter, export, manual entry |
| `QrStudioView.tsx` | `src/components/dashboard/qr/QrStudioView.tsx` | `loyaltyService`, `businessService` | QR generation, standee print layout |
| `CafeMenuView.tsx` | `src/components/dashboard/cafe/CafeMenuView.tsx` | `cafeService` | Category and item CRUD, 86 toggling |
| `CafeOrdersView.tsx` | `src/components/dashboard/cafe/CafeOrdersView.tsx` | `orderService` | Order status queue management |
| `SalonAppointmentsView.tsx`| `src/components/dashboard/salon/SalonAppointmentsView.tsx` | `salonService` | Booking queue and status transitions |
| `SalonCalendarView.tsx` | `src/components/dashboard/salon/SalonCalendarView.tsx` | `salonService` | Stylist schedule and time slot grid |
| `RetailCatalogueView.tsx` | `src/components/dashboard/retail/RetailCatalogueView.tsx` | `retailService` | Product inventory & in-store sales |
| `GymMembersView.tsx` | `src/components/dashboard/gym/GymMembersView.tsx` | `gymService` | Membership plans & member CRM |
| `CarWashServicesView.tsx` | `src/components/dashboard/carwash/CarWashServicesView.tsx`| `carWashService` | Wash package & bundle configuration |
| `GenericVisitView.tsx` | `src/components/dashboard/service/GenericVisitView.tsx` | `genericService` | Service job tickets and visit terminal |
| `CampaignsAndOffersView.tsx`| `src/components/dashboard/growth/CampaignsAndOffersView.tsx`| `growthService` | Promotions, audience preview, simulation |
| `AnalyticsView.tsx` | `src/components/dashboard/growth/AnalyticsView.tsx` | `growthService` | Date range filtering, KPI cards, CSV export |
| `PublicMenuPage.tsx` | `src/pages/PublicMenuPage.tsx` | `cafeService`, `orderService` | Menu browsing, cart, order submission |
| `PublicOrderTrackingPage.tsx`| `src/pages/PublicOrderTrackingPage.tsx`| `orderService` | Reactive order status tracking |
| `PublicBookingPage.tsx` | `src/pages/PublicBookingPage.tsx` | `salonService` | 5-step salon booking wizard |
| `PublicLoyaltyCardPage.tsx`| `src/pages/PublicLoyaltyCardPage.tsx` | `businessService`, `loyaltyService` | Customer join form & live stamp card |

---

## 5. Synchronous Assumptions & Migration Impact Analysis

The application currently enjoys **synchronous reads in components** because `bizStore.ts` acts as an in-memory document cache. However, this design carries specific architectural implications:

### Synchronous vs Asynchronous Reality:
1. **Reads Are Synchronous:**  
   Components call `loyaltyService.getCustomers(bizId)` and receive an immediate array of `CustomerRecord[]`. This prevents async/await boilerplate and loading spinners inside child render trees.
2. **First Mount Loading Gate:**  
   The synchronous model requires that **all data must be loaded before rendering**. `DashboardPage.tsx` enforces `bizStore.isReady(active.id)` before mounting `DashboardWorkspace`. If any collection is delayed by network latency, the entire dashboard displays a loading gate.
3. **Writes Are Asynchronously Fire-and-Forget:**  
   When a user clicks "Save Program" or "Issue Stamp", `bizStore.save()` updates the in-memory cache synchronously and commits a `writeBatch` in the background. If the batch commit fails on the server, the error is logged to console and `onError`, but **the UI does not roll back the optimistic change**.

---

## 6. Code Quality, React 19 & Dependency Findings

### A. React 19 Compiler Warnings
`oxlint` identified several patterns that trigger warnings under React 19 strict mode:
1. **Impure Render Functions (`react(purity)`):** Calling `Date.now()` or `new Date()` directly in component bodies (e.g. `SettingsView.tsx`, `OverviewView.tsx`). In React 19, render functions must be pure. Timestamps should be initialized in state or derived in effects/event handlers.
2. **Cascading Rerenders (`react(set-state-in-effect)`):** Calling `setState` synchronously within a `useEffect` without external triggers (e.g. `PublicLoyaltyCardPage.tsx`, `PublicBusinessGate.tsx`).

### B. Dependency Review (`package.json`)
- **Direct Dependencies:**
  - `@types/qrcode: ^1.5.6` (Misplaced in `dependencies` instead of `devDependencies`)
  - `canvas-confetti: ^1.9.4` (Active: confetti animation on onboarding & stamp completion)
  - `firebase: ^12.19.0` (Active: core backend SDK)
  - `jsqr: ^1.4.0` (Active: in-browser computer vision QR matrix decoding)
  - `lucide-react: ^1.61.0` (Active: UI iconography)
  - `qrcode: ^1.5.4` (Active: canvas and image QR generation)
  - `react: ^19.3.1` / `react-dom: ^19.3.1` (Active: core framework)
- **Dev Dependencies:**
  - `@tailwindcss/vite: ^4.3.3` / `tailwindcss: ^4.3.3` (Active: Tailwind v4 engine)
  - `puppeteer: ^25.16.0` (Used for headless verification scripts)
  - `oxlint: ^1.88.0` (Active: ultra-fast Rust-based linter)
  - `typescript: ~6.0.3` / `vite: ^8.3.4` (Active: build pipeline)
- **Missing Testing Packages:**  
  No `vitest`, `@testing-library/react`, or `@firebase/rules-unit-testing`.
