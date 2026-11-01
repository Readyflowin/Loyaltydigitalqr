# Comprehensive Onboarding and Dashboard Experience Audit

**Audit Date:** November 1, 2026  
**Audited System:** Loyaltydigitalqr Web Platform (`https://loyaltydigitalqr.com`)  
**Repository Branch:** `main`  
**Audit Scope:** Account entry, merchant authentication, wizard onboarding, reward configuration, public QR pages, and dashboard navigation.

---

## 1. Executive Summary

An exhaustive, non-destructive audit of the Loyaltydigitalqr codebase was conducted to inspect the current state of merchant signup, onboarding, loyalty reward mechanics, and dashboard architecture.

### Key Audit Findings
1. **Pricing Exposure on Account Entry:** The current signup page (`src/pages/SignupPage.tsx#L118-L137`) prominently displays country-specific pricing callouts (`Starter Plan · United States ($10/month)` vs `Switch to India (₹299/month)`) and reads the query parameter `?region=india|usa`. This violates the target requirement of a globally neutral, distraction-free account-entry experience.
2. **Onboarding Sequence Mismatch:** The current wizard in `src/pages/OnboardingPage.tsx` implements a 5-step flow:
   - Step 1: Business Basics (Name, Type, Region, Timezone)
   - Step 2: Choose Modules (Feature checkboxes)
   - Step 3: Business Details (Contact Email, Address, Phone, Location Type)
   - Step 4: Loyalty Program (Name, Stamps Required: 5/6/8/10/12, Reward Description, Brand Color)
   - Step 5: Review & Finish (Summary cards + Complete Setup)  
   The proposed journey requires:
   - Step 1: Signup / Login (Neutral "Start your free trial")
   - Step 2: Business Type Selection (Visual cards including popular verticals and "Other")
   - Step 3: Business Details (Name, optional Logo, Country deriving Currency, internal-only Timezone)
   - Step 4: Customer Reward Configuration (Stamps/Visits, Reward Type, Value/Description, Expiry with "Never expires" default)
   - Step 5: Final Review Card (Full summary, edit back-navigation, safe idempotent commit)
3. **"Other" Business Vertical Reuse:** A complete generic service catalogue already exists in `src/services/genericService.ts`, `src/components/dashboard/service/GenericServicesView.tsx`, and `src/pages/PublicServicesPage.tsx` (`/services/:slug`). It fully supports categorized service names, descriptions, prices, and durations, completely isolated per business in `businesses/{bizId}/serviceItems`. It does not need to be rewritten or forced into a café food menu.
4. **Reward Model & Expiry Gaps:** Currently, rewards are stored as freeform strings (`rewardDescription: string`), and `CustomerReward` (`src/types/loyalty.ts#L66-L74`) lacks an expiration timestamp. The system does not support structured reward types (`free_item`, `percentage_discount`, `fixed_amount`, `custom`) nor reward expiration policies.
5. **Trial Enforcement Reality:** The platform promises a "30-Day Unrestricted Free Trial" on signup and onboarding. In Firestore, `createBusiness` writes `trialEndsAt = now + 30 days`. However, there is no automated lockout or billing gateway; only a soft notification is triggered when `daysLeft <= 7`.

---

## 2. Current Implementation Audit: Step by Step

### 2.1 Route & Component Inventory

| Route | Page Component | Supporting Components | Primary Services |
| :--- | :--- | :--- | :--- |
| `/login` | `src/pages/LoginPage.tsx` | `Logo`, `Link` | `authService.ts` |
| `/signup` | `src/pages/SignupPage.tsx` | `Logo`, `Link` | `authService.ts` |
| `/onboarding` | `src/pages/OnboardingPage.tsx` | `LoyaltyCardPreview.tsx`, `VerifyEmailScreen.tsx` | `authService.ts`, `businessService.ts`, `loyaltyService.ts` |
| `/dashboard` | `src/pages/DashboardPage.tsx` | `DashboardSidebar.tsx`, `DashboardHeader.tsx`, `OverviewView.tsx`, `SettingsView.tsx`, `BusinessSwitcherModal.tsx` | `businessService.ts`, `loyaltyService.ts`, `growthService.ts` |
| `/card/:slug` | `src/pages/PublicLoyaltyCardPage.tsx` | `PublicBusinessGate.tsx`, `LoyaltyCard.tsx` | `businessService.ts`, `loyaltyService.ts`, `stampRequestService.ts` |
| `/services/:slug` | `src/pages/PublicServicesPage.tsx` | `PublicBusinessGate.tsx` | `businessService.ts`, `genericService.ts`, `carWashService.ts`, `gymService.ts` |

---

### 2.2 Account Entry: Signup & Login

#### Existing Signup Flow (`src/pages/SignupPage.tsx`)
- **Query Parameter Handling:** Checks `searchParams.get('region')` (lines 16-17). Defaults to `usa` if absent.
- **Pricing Callout:** Lines 26-42 define `pricingDetails`. Lines 118-137 render a prominent callout block:
  ```tsx
  <div className="mt-6 p-4 rounded-2xl bg-muted border border-border flex flex-col sm:flex-row ...">
    <span className="text-xs uppercase tracking-wider text-muted-foreground block font-semibold">SELECTED REGIONAL PLAN</span>
    <div className="font-heading font-bold text-sm sm:text-base text-foreground mt-0.5">
      Starter Plan · {pricingDetails.country} ({pricingDetails.priceFormatted})
    </div>
    <Link href={pricingDetails.switchHref} className="...">
      {pricingDetails.switchLabel}
    </Link>
  </div>
  ```
- **Authentication Providers:**
  1. **Google Sign-In:** Invokes `authService.signInWithGoogle()` (using `GoogleAuthProvider` popup via Firebase Auth SDK).
  2. **Email & Password:** Invokes `authService.signUpWithEmail(email, password, fullName)`. Enforces minimum 8 characters. Sends Firebase email verification link via `sendEmailVerification`.
- **Session Persistence & Draft:**
  - `startOnboarding()` initializes a draft in `localStorage` under `loyalty_onboarding_draft_${uid}` via `authService.saveOnboardingDraft()`.
  - Redirects to `/onboarding?region=${region}&plan=starter`.

#### Existing Login Flow (`src/pages/LoginPage.tsx`)
- Supports Google sign-in and Email/Password sign-in.
- Supports password reset via `authService.sendPasswordReset(email)`.
- Features an "Already signed in" banner if session is active.
- Redirects to `/dashboard` (or `?redirect=` param).
- Does **not** display regional pricing banners (neutral login), but links to `/signup` with "Start 30-day free trial →".

---

### 2.3 Current Onboarding Wizard Flow (`src/pages/OnboardingPage.tsx`)

#### Auth & Email Verification Gate
- `OnboardingPage.tsx` checks `authService.getCurrentUser()`. If unauthenticated, it immediately redirects to `/signup`.
- Checks `authService.needsEmailVerification()` (lines 240-242). If user signed up via email and has not verified, it renders `<VerifyEmailScreen />`.
- If user has pending invites to an existing business, it routes them to `/dashboard` unless `?own=1` is specified.

#### Current 5 Steps:
```
[Step 1: Business Basics] -> [Step 2: Modules] -> [Step 3: Details] -> [Step 4: Loyalty] -> [Step 5: Review]
```

1. **Step 1 — Business Basics:**
   - Fields: Business Name (`businessName`), Business Type (`businessType`), Region (`region`: `usa`, `india`, `other`), Timezone (`timeZone`).
   - Defect: Operating Region dropdown displays prices: `United States (USD — $10/mo)` and `India (INR — ₹299/mo)`.
   - Defect: Visible timezone dropdown exposes raw Olson strings (`America/New_York`, `Asia/Kolkata`, etc.).
2. **Step 2 — Choose Modules:**
   - Checkbox list based on `recommendedModules` for the selected business type.
   - Modules include: `loyalty-cards`, `table-menu-qr`, `customer-ordering`, `appointment-management`, `product-catalogue`, etc.
   - Note: This step adds friction for first-time business owners and is absent from the target streamlined journey.
3. **Step 3 — Business Details:**
   - Fields: Contact & Administration Email (`contactEmail`), Storefront Address (`address`, optional), Business Phone (`phoneNumber`, optional), Location Type (`first` vs `additional`).
4. **Step 4 — Loyalty Program:**
   - Fields: Program Title (`programName`), Stamps Required (`stampsRequired`: buttons for 5, 6, 8, 10, 12), Reward Description (`rewardDescription`), Brand Color Accent (`accentColor`).
   - Renders live interactive preview: `<LoyaltyCardPreview />`.
   - Defect: No reward type selection; no expiry configuration.
5. **Step 5 — Review and Finish:**
   - Summary cards displaying Steps 1 through 4 with "Edit" jump links.
   - "Complete setup" button invokes `businessService.createBusiness(formData)`.
   - Shows confirmation screen with the generated Staff PIN (`createdStaffPin`), summary card, and "Enter Business Workspace" button (`/dashboard`).

---

### 2.4 Business Creation & Persistence Mechanism

In `src/services/businessService.ts#L284-L371`:
1. `authService.ensureFreshToken()` ensures Firebase token has `email_verified: true`.
2. Generates `businessId = newId()`.
3. Calculates `createdAt = new Date().toISOString()` and `trialEndsAt = createdAt + 30 days`.
4. Saves private document to Firestore: `businesses/{businessId}`.
5. Reserves unique public slug in Firestore: `slugs/{slug}` pointing to `businessId`.
6. Updates `businesses/{businessId}` with `slug`.
7. Saves public profile document to Firestore: `publicProfiles/{businessId}`.
8. Writes loyalty program config: `businesses/{businessId}/config/loyaltyProgram`.
9. Sets active business in `localStorage` (`loyalty_active_business_id`).
10. Clears local draft via `authService.clearOnboardingDraft()`.

---

## 3. Comparison: Current Flow vs. Target Journey

| Dimension | Current Implementation | Target Desired Experience | Audit Assessment |
| :--- | :--- | :--- | :--- |
| **Signup/Login Pricing** | Displays `$10/mo` vs `₹299/mo` switch banners on `/signup`. | Completely neutral account entry: "Start your free trial". No regional pricing. | **Gap:** Regional callout must be removed from signup/login. Keep pricing strictly on public `/pricing`, `/usa`, `/india`. |
| **Step Progression** | 5 Steps: Basics (with TZ/Region) -> Modules -> Contact -> Loyalty -> Review. | 5 Steps: Account Entry -> Business Type Selection -> Business Details -> Rewards Setup -> Final Review Card. | **Gap:** Step sequence must be restructured. Modules step eliminated from onboarding. |
| **Business Categories** | 7 types: `cafe`, `restaurant`, `salon`, `retail`, `gym`, `carwash`, `service`. | Popular cards: Coffee shops, Restaurants, Bakeries, Salons/Barbers, Beauty, Nails, Spas, Wellness, Gyms, Retail, Car wash, Other. | **Gap:** Expand UI category cards; map new categories cleanly to underlying services. |
| **"Other" Category** | Supported via `service` type and `genericService.ts`. | Business owner can configure custom services in catalogue, scannable via QR. | **Already Implemented:** `genericService` and `PublicServicesPage` exist. Only onboarding integration needed. |
| **Business Details Fields** | Name, Region, Timezone, Contact Email, Address, Phone, Location Type. | Name, Logo (optional), Country (derives currency). No visible timezone, no subscription prices. | **Gap:** Hide timezone from UI (derive internally); remove region pricing; add optional logo upload. |
| **Currency & Country** | Region enum (`usa`, `india`, `other`) sets currency to USD or INR. | Country selector automatically binds currency (e.g. India -> INR ₹, US -> USD $). | **Gap:** Map country selection directly to currency without exposing subscription pricing. |
| **Reward Types** | Only single string `rewardDescription`. | Structured types: Free Item, Percentage Discount, Fixed Amount Off, Custom Reward. | **Gap:** Missing structured type definition and currency-aware amount formatting. |
| **Reward Expiry** | No expiration concept anywhere in loyalty data models. | Default "Never expires" with selectable expiry options during setup. | **Gap:** Data model and UI must support reward voucher expiration. |
| **Post-Onboarding Reward Edit** | Dashboard Settings allows editing stamps and description. Overwrite is immediate. | Editing must safely preserve existing customer balances and issued vouchers. | **Gap:** Rules and migration semantics must guarantee customer stamp integrity. |
| **Final Review Card** | Summary of Steps 1-4 with jump-back links. | Summary card covering Name, Logo, Type, Country, Currency, Threshold, Reward Type, Description, Expiry, Services (Other). | **Implemented but Needs Improvement:** Review screen exists but needs updated fields. |

---

## 4. Deep Dive: Business Types and the "Other" Custom Services Flow

### 4.1 Supported Industry Verticals in Current Code
The existing application supports 7 core `BusinessType` values defined in `src/types/onboarding.ts#L1-L8`:
1. `cafe`: Coffee shops, espresso bars. (Dedicated views: Menu, Tables, Orders, KDS).
2. `restaurant`: Dining establishments. (Shares café stack: Menu, Tables, Orders, KDS).
3. `salon`: Hair salons, barbershops, beauty studios. (Dedicated views: Appointments, Calendar, Services, Staff).
4. `retail`: Boutiques, retail shops. (Dedicated view: Product Catalogue).
5. `gym`: Gyms, fitness studios. (Dedicated views: Members, Visit Check-In, Classes).
6. `carwash`: Car washes, auto detailing. (Dedicated views: Wash Services, Prepaid Bundles, Pass Redemption).
7. `service`: Generic and professional service businesses. (Dedicated views: Services Catalogue, Record Service Event).

### 4.2 Mapping the Proposed 12 Business Types
To maintain 100% backwards compatibility with existing dashboard views, security rules, and public gates:
- **Coffee shops** -> maps to `cafe`
- **Restaurants** -> maps to `restaurant`
- **Bakeries** -> maps to `cafe` (or `restaurant`)
- **Hair salons and barbers** -> maps to `salon`
- **Beauty salons** -> maps to `salon`
- **Nail salons** -> maps to `salon`
- **Spas** -> maps to `salon` or `service`
- **Wellness centres** -> maps to `gym` or `service`
- **Gyms and fitness studios** -> maps to `gym`
- **Retail stores** -> maps to `retail`
- **Car wash businesses** -> maps to `carwash`
- **Other** -> maps to `service`

### 4.3 Audit of the "Other" Custom Services & Public QR Workflow
The audit specifically investigated whether the existing application can support custom services for generic businesses without rebuilding the QR system:
1. **Can it represent general services?** Yes. `src/types/serviceBusiness.ts` defines:
   ```ts
   export interface GenericServiceItem {
     id: string;
     businessId: string;
     name: string;
     description: string;
     price: number; // minor currency units (cents/paise)
     category: string;
     estimatedMinutes: number;
     isActive: boolean;
     createdAt: string;
   }
   ```
2. **Can prices and categories be entered?** Yes. `GenericServicesView.tsx` (`src/components/dashboard/service/GenericServicesView.tsx`) provides full CRUD operations for service items, including major-unit price parsing to minor units, category tagging, and duration.
3. **Can customers see services after scanning a QR?** Yes. Route `/services/:slug` renders `PublicServicesPage.tsx`. When a business has `businessType === 'service'`, it loads `genericService.getServices(business.id)`, groups them into categories, displays cards with name, description, formatted price, duration, and includes a direct CTA to `/card/:slug`.
4. **Is the QR code linked to the right business?** Yes. `QrCreateModal.tsx#L32-L40` automatically routes storefront QR codes for `service` businesses to `/services/${business.slug}`.
5. **Are different businesses' public menus/services isolated?** Yes. Firestore path `businesses/{bizId}/serviceItems` is completely scoped to the business ID. Security rules (`firestore.rules#L191`) allow public read on `serviceItems` for that specific `bizId`, while writes require manager privileges.
6. **Does this flow need online booking?** No. `PublicServicesPage` is an informational service catalogue. Online booking is part of `salonService`, not `genericService`.

**Conclusion:** The existing generic service architecture is robust and ready. For the proposed "Other" flow, no rewrite of the QR or storefront infrastructure is required.

---

## 5. Audit Evidence: Code & Data Flow

### 5.1 Pricing Leak Evidence on Signup
- `src/pages/SignupPage.tsx#L16-L42`:
  ```ts
  const regionParam = searchParams.get('region');
  const region: OperatingRegion = regionParam === 'india' ? 'india' : 'usa';
  const planName = 'Starter';
  const pricingDetails = region === 'india'
    ? { country: 'India', currency: 'INR', priceFormatted: '₹299/month', ... }
    : { country: 'United States', currency: 'USD', priceFormatted: '$10/month', ... };
  ```
- `src/pages/SignupPage.tsx#L118-L137`:
  Renders the visible callout banner informing the user of the regional price and offering a switch link.

### 5.2 Timezone Internal Binding Evidence
- `src/services/businessService.ts#L317`:
  ```ts
  timeZone: data.timeZone,
  ```
- `src/services/salonService.ts#L612`:
  ```ts
  businessTimeZone: business?.timeZone || 'America/New_York',
  ```
Timezone is critical for calculating date boundaries and booking slots. When hiding it from the onboarding form, `data.timeZone` can be initialized from `Intl.DateTimeFormat().resolvedOptions().timeZone` or country defaults, keeping all date arithmetic operational.

### 5.3 Program Modification Risk Evidence
In `src/services/loyaltyService.ts#L151-L177`, `saveProgram()` updates `stampsRequired` and `rewardDescription` in `businesses/{bizId}/config/loyaltyProgram`.
- Existing customers in `businesses/{bizId}/customers` keep their `currentStamps` integer.
- If `stampsRequired` changes from 8 to 5, a customer with 6 stamps will unlock a reward on their next stamp (6 + 1 = 7 >= 5).
- If `rewardDescription` changes, existing unredeemed rewards in `customer.rewards` retain their historical `rewardDescription` because `CustomerReward` stores a snapshot at unlock time (`src/services/loyaltyService.ts#L522`). This is good architecture and must be preserved.

---

## 6. Recommendations for Target Implementation

1. **Clean Signup/Login:** Strip all regional query parameters and pricing callouts from `SignupPage.tsx`. Keep pricing details strictly on `/pricing`, `/usa`, and `/india`.
2. **Restructure Onboarding to 5 Steps:**
   - **Step 1:** Account creation (Neutral, "Start your free trial").
   - **Step 2:** Business Type selection (12 visual cards, mapping to underlying `BusinessType`).
   - **Step 3:** Business Details (Business Name, optional Logo upload, Country selection driving Currency; internal-only Timezone derivation).
   - **Step 4:** Reward Configuration (Threshold, Reward Type, Description/Value, Expiry default "Never expires").
   - **Step 5:** Final Review Card (Summary of all fields, back navigation, idempotent submit).
3. **Connect "Other" Category:** For businesses selecting "Other", provide an optional step to enter 1-3 initial services (name, price, category), saving directly to `businesses/{bizId}/serviceItems`.
4. **Idempotent Workspace Creation:** Wrap business creation, slug reservation, and config creation in a resilient transaction/batch to prevent orphaned business documents if link reservation fails.
