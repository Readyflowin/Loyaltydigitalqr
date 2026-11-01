# Loyaltydigitalqr — Implementation Blueprint (Rev. 2)

**Onboarding Redesign · Loyalty Configuration · Reviews & Social Engagement · Multi-Branch Management**

**Author:** Principal Architect (Claude) · **Date:** 2026-11-01 · **Revision:** 2 (architecture-review correction pass)
**Status:** Architecture only — no application source, config, Firebase data, rules or dependencies were modified to produce this document.
**Implementer:** Gemini Antigravity (follows this blueprint exactly; does not invent architecture).
**Companion:** `ANTIGRAVITY_PROMPTS.md` (six copy-ready batch prompts; kept in lock-step with this file).

> Rev. 2 resolves the 13 corrections from the architecture review. See **§16 ARCHITECTURE_REVIEW_CHANGELOG** for what changed and why. Where the six audit reports' *recommendations* conflict with the decisions here, these decisions win; the audits remain accurate on the *current* code. Verified code references use `path#Lnn`.

---

## 1. Understanding of the current architecture

### 1.1 Stack and tenancy
- React 19 + TypeScript + Vite 8, Tailwind v4. Firebase Auth + Cloud Firestore. Cloudflare R2 image uploads via a Worker (`worker/src/index.ts`). SPA on Vercel (`vercel.json` rewrite).
- Multi-tenant, business-scoped. Private root `businesses/{bizId}`; public reads from `publicProfiles/{bizId}`, `slugs/{slug}`, and sanitized per-business projections (`memberCards`, `menus`, `serviceItems`, …).
- **`src/lib/bizStore.ts`** is the reactive cache: attaches a business in `member` or `public` mode, `onSnapshot`-subscribes to each registered `ModuleSpec`'s collections, and flushes diffed writes in batched `setDoc`/`delete` (`#L395-L476`). Only collections flagged `public: true` load in `public` mode.
- Service modules register specs (loyalty, cafe, salon, retail, gym, carwash, generic) and expose synchronous getters + `subscribe()`.

### 1.2 Account entry & onboarding (current — verified)
- `/signup` (`src/pages/SignupPage.tsx`) reads `?region=`; renders a regional pricing callout (`#L16-L52,#L121-L135`).
- `/login` (`src/pages/LoginPage.tsx`): Google + email/password + reset; "Start 30-day free trial" link.
- `/onboarding` (`src/pages/OnboardingPage.tsx`) is a 5-step wizard with a **visible Region+Timezone** step and a **Choose Modules** step; gated by `authService.needsEmailVerification()`.
- `OnboardingData` (`src/types/onboarding.ts#L31-L60`) carries all step fields.

### 1.3 Business creation (current — verified)
`businessService.createBusiness` (`#L284-L371`) does **four sequential, non-atomic writes**: `setDoc(businesses/{id})` → `reserveSlug` (a `runTransaction` on `slugs/{slug}`) → `updateDoc({slug})` → `setDoc(publicProfiles/{id})` + `setDoc(config/loyaltyProgram)`. No idempotency; a retry/refresh after step 1 duplicates the business.

### 1.4 Trial (current — verified)
`Business.trialEndsAt = createdAt + 30d` (`TRIAL_DAYS=30`, `#L54`). **No `trialStatus`, no enforcement, no billing.** Only a soft notice fires when `daysLeft ≤ 7` (`getNotifications#L686-L700`). The user retains full access after expiry.

### 1.5 Currency / region / timezone (current — verified)
- `Business.currency: 'USD'|'INR'`, `currencySymbol: '$'|'₹'`, hardcoded by `isIndia` (`#L291,L311-L314`).
- `formatMinorUnits(amountMinor, currency)` handles only INR vs USD (`src/types/cafe.ts#L137`); INR drops decimals when whole (display-only; storage is paise).
- `timeZone` is a visible onboarding field, stored on `Business`, used by salon scheduling, and **projected into `publicProfiles`** (`toPublicProfile#L71`).

### 1.6 Loyalty model (current — verified)
- `LoyaltyProgramConfig` has `stampsRequired`, free-text `rewardDescription`; **no `rewardType/rewardValue/expiry`.**
- `CustomerReward` (`#L26-L34`) has `voucherCode/unlockedAt/isRedeemed`; **no `expiresAt`.**
- On milestone, `issueStamp` **snapshots** the reward description at unlock (`#L520-L527`) — editing the program later does not rewrite issued vouchers (correct; must be preserved & extended with an `expiresAt` snapshot).
- Mutations (stamp issuance, redemption) run **client-side** via `bizStore` gated by rules (members). Self-enroll/orders/stampRequests use strict public-create rules.

### 1.7 Locations / branches (current — verified)
- `BusinessLocation = { id, name, address, isPrimary, staffPin }` (`src/types/business.ts#L4-L10`), stored as an **embedded array** on `businesses/{id}.locations`, mirrored (PIN-stripped) to `publicProfiles` (`toPublicProfile#L73`).
- `staffPin` is **plaintext**, verified **client-side** (`verifyStaffPin#L570-L583`): a location's own PIN if present, else **any location's PIN**.
- `updateBusiness` overwrites `locations` with the client's array via `updateDoc` (`#L403-L405`) — lost-update risk under concurrent edits. Removing a location would splice (destructive).
- `AnalyticsView` aggregates business-wide (`'7d'|'30d'|'90d'|'all'`); events carry `locationId` but there is **no branch filter**.

### 1.8 Social / reviews (current — verified): none.
### 1.9 "Other" / generic services (current — verified, reusable)
`genericService.ts` manages `businesses/{bizId}/serviceItems` (public-readable); `/services/:slug` → `PublicServicesPage.tsx`; `QrCreateModal` routes `service/carwash/gym` storefront QRs to `/services/:slug`. No rebuild needed.
### 1.10 Image upload (current — reusable)
`worker/src/index.ts`: Firebase-token-auth'd R2 endpoint, membership check by reading `businesses/{id}` with the caller's token, `kind ∈ {menu-item,product,service,staff,logo}`, size/type/origin checks. `src/lib/uploads.ts` is the client. `logo` already supported.

---

## 2. Current vs desired experience (gap summary)

| Area | Current | Desired | Decision |
|---|---|---|---|
| Account entry | regional pricing + `?region` switch; "30-day" copy | neutral "Start your free trial" (no price, **no duration number**) | D-trial, D1-entry |
| Onboarding steps | 5: Basics(+TZ/region)→Modules→Details→Loyalty→Review | 5: Account→Type→Details(name/logo/country)→Rewards→Review | remove Modules; hide TZ; country→currency |
| Categories | 7 engines | compact **8 top-level cards** (+ optional salon/other subtypes) → 7 engines | D-cat (C11) |
| Reward model | free-text string | structured `rewardType/value/description/expiry` | D-reward |
| Reward expiry | none | default "Never expires", optional duration; per-voucher snapshot | D-reward |
| Social/reviews | none | settings tab + public-card links + click analytics (counts) | D-social, D-worker, D-analytics |
| Branches | embedded array, no status/phone/hours, overwrite writes | add/edit/archive/reactivate (transactional); phone/hours; **no PIN UI yet** | D-branch, D-pin |
| Trial | recorded, unenforced | truthful; minimal status; **no enforcement this phase** | D-trial |
| Idempotent create | 4 sequential writes | no duplicate business/services on retry | D-idem |
| Firestore rules | edited inline | **rules changed only in Batch 6** (final security phase) | D-rulesphase (C12) |

---

## 3. Architectural decisions and rationale

**D1 — Keep the seven engine identifiers.** `cafe, restaurant, salon, retail, gym, carwash, service` unchanged (renames = cross-cutting migration). The user-facing categories are a presentation layer.

**D-cat — Compact category selection (C11).** Show **8 top-level cards** using **only the existing icon set** (`Coffee, UtensilsCrossed, Scissors, ShoppingBag, Dumbbell, Car, Briefcase`): Coffee shop→`cafe`, Restaurant→`restaurant`, Bakery→`cafe`, Salon & Spa→`salon`, Gym & Fitness→`gym`, Retail store→`retail`, Car wash→`carwash`, Other→`service`. Finer information is retained **without cluttering**: selecting *Salon & Spa* reveals an optional one-tap subtype chip (Hair/Barber, Beauty, Nails, Spa); *Other* reveals an optional subtype (Wellness, Professional service, Other). Subtypes set `category` (for analytics/copy) but never change the engine. **No category is removed** — hair/beauty/nails/spa/wellness remain reachable as subtypes; product impact: faster, less cluttered mobile onboarding with the same coverage. **No sparkle/decorative icons.**

**D-tz — Country-aware timezone resolution with a review flag (C2).** Never show a timezone field in onboarding. Resolve internally: let `browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone`. If `browserTz` is one of the selected country's `timeZones`, use it (`timeZoneSource:'browser'`, `timeZoneConfirmed:true`). Otherwise use the country's `defaultTimeZone` and set `timeZoneSource:'country_default'`, `timeZoneConfirmed:false` (a **review state**). Settings shows a one-line "Confirm your business time zone" prompt when `timeZoneConfirmed === false`, letting the owner pick/confirm (`timeZoneSource:'manual'`). Per-branch `timeZone?` overrides the business value for that branch's scheduling. Scheduling/analytics always have a usable value and never silently run on a *known-incorrect* zone (the review flag surfaces uncertainty). Single-zone countries are always `confirmed:true`.

**D4 — Accurate country→currency; explicit choice for unlisted; no silent USD (C2, C9).** `countriesData.ts` lists **real countries** (not "EU"). The Eurozone is represented as its member countries (IE, DE, FR, ES, IT, NL, …) each → `EUR`. Each country carries a **`recommendedCurrency`**; a small set of countries that legitimately transact in more than one currency may list `altCurrencies`. The onboarding currency field shows the recommended currency **pre-selected but changeable within the supported-currency set**. If the owner's country is **not listed**, they pick "Country not listed" and must **explicitly choose a currency** from the supported list — **there is no silent USD default**. `currency` is set once at onboarding and **locked after the first monetary record exists** (never convert historical amounts; keeps analytics single-currency). Public pricing pages keep fixed USD/INR prices (unrelated).

**D-money — Minor-unit precision per currency; convert once at the boundary (C9).** Every supported currency declares `minorUnitDigits` (all currently listed = 2). Financial values are **stored as integer minor units** (`amount × 10^digits`). Form inputs show **major units**; conversion major↔minor happens exactly once at the UI/service boundary (`toMinor`/`toMajor`). **Never store formatted strings.** `formatMinorUnits` uses the currency's declared `minorUnitDigits`; the existing INR "drop .00 when whole" is a **display-only** nicety (storage remains paise). USD/INR behaviour is byte-for-byte backward compatible. This precision rule governs **fixed-amount rewards** and **initial-service prices** identically.

**D-reward — Structured rewards with per-voucher expiry snapshots; three expiry concepts kept separate.**
- Program policy: `LoyaltyProgramConfig.expiryDays: number | null` (`null`/`0` = never).
- Issued-voucher expiry: `CustomerReward.expiresAt: string | null`, computed **at unlock** then frozen. Program edits never rewrite existing vouchers.
- Stamp-progress expiry: **intentionally NOT implemented now** (documented; current `currentStamps` never expired).
- Back-compat: missing `rewardType` ⇒ `'custom'`; missing `expiresAt` ⇒ never. Redemption validates `expiresAt` against the actual reward record.

**D-social — Social links: private config + minimized public projection (C4).** `businesses/{id}.socialLinks` (private) with independent toggles; disabling keeps the URL; only enabled + valid `https` channel links are projected to `publicProfiles/{id}`. Saved by a **single `businessService.updateSocialLinks`** method (no duplicate service): it loads the current full `Business`, merges, and writes `businesses/{id}` + `publicProfiles/{id}` in **one `writeBatch`** (atomic → no partial inconsistency). Validation lives in `src/utils/socialUrls.ts`.

**D-worker — Social clicks via the Cloudflare Worker (trusted), not anonymous Firestore writes (C5).** Overrides the audit's direct-write option. The public card POSTs to the Worker `/social-click`; the Worker validates origin + body, confirms the destination is enabled on `publicProfiles`, **verifies any `locationId` against an active location**, rate-limits, and writes the event with a **service account**. The event carries **no customer identifier** (C5 data-minimization). Clients can never write `socialClicks`. Full contract in §6.

**D-analytics — Dashboard totals via Firestore aggregation counts, not raw event loads (C6).** The dashboard uses `getCountFromServer` aggregation queries (per destination, per range, optional branch) — it never pages raw events into the browser to show three totals. Required composite indexes and costs in §5.3/§6.4.

**D-branch — Embedded array, transactional mutations, soft-archive, no new PIN exposure (C3, C8).** Keep locations embedded (small N; trivial rules/mirror). **All branch mutations run in a `runTransaction`** (read-modify-write the array) to prevent lost updates and stale-array overwrites. Add `status/phoneNumber/operatingHours?/timeZone?/createdAt`. Archiving sets `status:'archived'` (never splice; preserves historical `locationId`); refuse archiving the **last active** branch. Customer/CRM/loyalty stay business-wide (D-scope). Migration to a subcollection is deferred (trigger: routinely > ~50 branches or needing per-branch concurrent high-write).

**D-pin — Do not expand plaintext-PIN exposure; defer per-branch PIN to the security phase (C3).** The branch UI (`BranchEditModal`) has **no PIN field**. New branches are created **without a `staffPin`**. Branch list/edit data returned to the UI **omits `staffPin`**. No new plaintext PIN is written by this feature. Interim behaviour: counter staff at a new branch authenticate using an **existing** location PIN (via the current `verifyStaffPin` fallback that matches any location's PIN) — so stamping/redemption keep working business-wide. **Deferred until the security phase:** a *branch-specific* PIN, which requires a **secure trusted-backend PIN create/verify contract** (hashed storage + server verification), out of scope here. This pass does **not** claim the pre-existing plaintext-PIN vulnerability is fixed.

**D-scope — Customer profiles & loyalty stay business-wide (policy).** Branch filters scope only operational/attributed metrics (visits, stamps, orders, social clicks). CRM/loyalty totals are never hidden by a branch filter. Future per-branch loyalty is possible via a program `scope` field; out of scope now.

**D-idem — Idempotent business *and* initial-service creation (C7, D10).** The draft holds a once-generated `pendingBusinessId`, a once-reserved `reservedSlug`, and — for "Other" — a once-generated stable `id` per initial service. `createBusiness` resumes if `businesses/{pendingBusinessId}` already exists and is owned by the caller; every post-business write is an idempotent `setDoc`; each initial service is written with its deterministic id via `genericService.upsertService` so a retry finishes the remainder without duplicating saved ones.

**D-trial — Truthful, unenforced trial (C10).** Trial starts at `createdAt`; duration = current config `TRIAL_DAYS = 30` → `trialEndsAt`. Stored: `trialEndsAt` + new `trialStatus`. Derived status: `active_paid`/`canceled` if set, else `trialing` while `now < trialEndsAt`, else `expired`. **On expiry nothing is enforced — the user keeps full access; no automatic charge occurs; no upgrade is forced.** The dashboard may show a **soft, informational** notice ("Free trial ends in N days" / "Free trial ended — contact us to continue") that does not claim loss of access. A future paid subscription would set `trialStatus:'active_paid'` via a trusted billing path (not built). **Signup copy is neutral: "Start your free trial" with no price and no duration number.** The full trial lifecycle (billing, enforcement) is **explicitly out of scope**; this is documented as a limitation.

**D-rulesphase — Firestore rules change only in Batch 6 (C12).** Batches 1–5 **do not edit or deploy `firestore.rules`**; each documents the rule changes it requires and introduces **no client access that violates existing rules**. Batch 6 consolidates all required changes into a single copy-ready `firestore.rules`, explains each change, validates with the Firebase Emulator / rules test setup, and **does not auto-deploy** (manual paste into Firebase Console).

**D11 — Security posture carried forward (unchanged from Rev. 1).** Both pre-existing findings (plaintext PINs; untrusted client stamp/redeem/order mutations) are **still present** and documented as security-phase prerequisites (§6.1). This work must not widen them.

---

## 4. Data-model design (TypeScript contracts) — **field names are normative**

> **Batching note (C1):** fields are introduced in the batch that first uses them, so each batch compiles independently. `RewardType` is defined in **Batch 3** (`types/loyalty.ts`); nothing earlier imports it. See the dependency table in §10.1.

### 4.1 `src/types/onboarding.ts` (MODIFY — fields added across batches)
```ts
export type BusinessType = 'cafe'|'restaurant'|'salon'|'retail'|'gym'|'carwash'|'service'; // UNCHANGED
export type OperatingRegion = 'usa'|'india'|'other'; // KEEP (legacy bridge + public pricing)

// Batch 2:
export type OnboardingCategoryId =
  | 'coffee_shop'|'restaurant'|'bakery'
  | 'hair_salon'|'beauty_salon'|'nail_salon'|'spa'
  | 'gym_fitness'|'retail'|'car_wash'
  | 'wellness'|'professional'|'other';

export interface OnboardingData {
  // ---- Batch 1 (minimal, for idempotency typing) ----
  pendingBusinessId?: string;   // deterministic id for idempotent create (D-idem)
  reservedSlug?: string;        // reserved once, reused on retry

  // ---- existing fields (unchanged) ----
  businessName: string;
  businessType: BusinessType;
  region: OperatingRegion;
  timeZone: string;
  logoInitial: string;
  programName: string;
  stampsRequired: number;
  rewardDescription: string;
  accentColor: string;
  currentStep: number;
  isCompleted: boolean;
  planContext?: string;
  completedAt?: string;
  // made OPTIONAL in Batch 2 (no longer collected in the wizard):
  selectedModules?: string[];
  contactEmail?: string;
  address?: string;
  phoneNumber?: string;
  displayName?: string;
  locationType?: 'first'|'additional';

  // ---- Batch 2 ----
  category?: OnboardingCategoryId;
  countryCode?: string;         // ISO-3166 alpha-2, or 'ZZ' for "not listed"
  currency?: string;            // ISO-4217 (explicitly chosen; never silently defaulted)
  currencySymbol?: string;
  logoUrl?: string | null;
  initialServices?: InitialServiceDraft[];  // see 4.6

  // ---- Batch 3 (RewardType exists now) ----
  rewardType?: RewardType;      // imported from '../types/loyalty' in Batch 3
  rewardValue?: number;         // percent int, or minor-units int
  expiryDays?: number | null;   // null/0 = never
}
```
**Batch 1** adds only `pendingBusinessId`/`reservedSlug`. **Batch 2** adds `category/countryCode/currency/currencySymbol/logoUrl/initialServices` and relaxes `selectedModules/contactEmail/...` to optional. **Batch 3** adds `rewardType/rewardValue/expiryDays` and the `import type { RewardType } from '../types/loyalty'`. No batch imports a type a later batch defines.

### 4.2 `src/data/onboardingCategories.ts` (CREATE — Batch 2) — compact 8-card model + subtypes
```ts
import type { BusinessType, OnboardingCategoryId } from '../types/onboarding';
type ExistingIcon = 'Coffee'|'UtensilsCrossed'|'Scissors'|'ShoppingBag'|'Dumbbell'|'Car'|'Briefcase';

export interface PrimaryCategory {
  id: OnboardingCategoryId;      // the default category stored when no subtype is chosen
  label: string; helper: string; iconName: ExistingIcon; engine: BusinessType;
  subtypes?: { id: OnboardingCategoryId; label: string }[]; // optional refinement, same engine
}
export const PRIMARY_CATEGORIES: PrimaryCategory[] = [
  { id:'coffee_shop', label:'Coffee shop',   helper:'Cafés, espresso bars', iconName:'Coffee',          engine:'cafe' },
  { id:'restaurant',  label:'Restaurant',    helper:'Dining, bistros',      iconName:'UtensilsCrossed', engine:'restaurant' },
  { id:'bakery',      label:'Bakery',        helper:'Bakeries, patisseries',iconName:'Coffee',          engine:'cafe' },
  { id:'hair_salon',  label:'Salon & Spa',   helper:'Hair, beauty, nails, spa', iconName:'Scissors',    engine:'salon',
    subtypes:[ {id:'hair_salon',label:'Hair / Barber'},{id:'beauty_salon',label:'Beauty'},{id:'nail_salon',label:'Nails'},{id:'spa',label:'Spa'} ] },
  { id:'gym_fitness', label:'Gym & Fitness', helper:'Gyms, studios',        iconName:'Dumbbell',        engine:'gym' },
  { id:'retail',      label:'Retail store',  helper:'Shops, boutiques',     iconName:'ShoppingBag',     engine:'retail' },
  { id:'car_wash',    label:'Car wash',      helper:'Wash & detailing',     iconName:'Car',             engine:'carwash' },
  { id:'other',       label:'Other',         helper:'Any other business',   iconName:'Briefcase',       engine:'service',
    subtypes:[ {id:'wellness',label:'Wellness'},{id:'professional',label:'Professional service'},{id:'other',label:'Other'} ] },
];
export function categoryToEngine(id: OnboardingCategoryId): BusinessType; // lookup; default 'service'
export function categoryLabel(id?: OnboardingCategoryId): string;         // for review/analytics display
```
Selecting a primary card stores its `id` as `category` and `engine` as `businessType`; choosing a subtype overrides `category` only. Icons are limited to the existing seven.

### 4.3 `src/data/countriesData.ts` (CREATE — Batch 2) — accurate country/currency/timezone
```ts
export interface CurrencyMeta { code: string; symbol: string; minorUnitDigits: number; }
export const CURRENCIES: Record<string, CurrencyMeta> = {
  USD:{code:'USD',symbol:'$',minorUnitDigits:2}, INR:{code:'INR',symbol:'₹',minorUnitDigits:2},
  GBP:{code:'GBP',symbol:'£',minorUnitDigits:2}, EUR:{code:'EUR',symbol:'€',minorUnitDigits:2},
  CAD:{code:'CAD',symbol:'$',minorUnitDigits:2}, AUD:{code:'AUD',symbol:'$',minorUnitDigits:2},
  AED:{code:'AED',symbol:'AED',minorUnitDigits:2}, NZD:{code:'NZD',symbol:'$',minorUnitDigits:2},
  SGD:{code:'SGD',symbol:'$',minorUnitDigits:2}, ZAR:{code:'ZAR',symbol:'R',minorUnitDigits:2},
};
export interface CountryOption {
  code: string;               // ISO-3166 alpha-2 (real countries only)
  name: string;
  recommendedCurrency: string;// key of CURRENCIES
  altCurrencies?: string[];   // additional legitimate currencies, if any
  defaultTimeZone: string;    // IANA
  timeZones: string[];        // IANA zones valid for this country (browser-tz validation)
  region: 'usa'|'india'|'other';
}
export const SUPPORTED_COUNTRIES: CountryOption[] = [
  { code:'US', name:'United States',  recommendedCurrency:'USD', defaultTimeZone:'America/New_York',
    timeZones:['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Phoenix','America/Anchorage','Pacific/Honolulu'], region:'usa' },
  { code:'IN', name:'India',          recommendedCurrency:'INR', defaultTimeZone:'Asia/Kolkata', timeZones:['Asia/Kolkata'], region:'india' },
  { code:'GB', name:'United Kingdom', recommendedCurrency:'GBP', defaultTimeZone:'Europe/London', timeZones:['Europe/London'], region:'other' },
  { code:'IE', name:'Ireland',        recommendedCurrency:'EUR', defaultTimeZone:'Europe/Dublin', timeZones:['Europe/Dublin'], region:'other' },
  { code:'DE', name:'Germany',        recommendedCurrency:'EUR', defaultTimeZone:'Europe/Berlin', timeZones:['Europe/Berlin'], region:'other' },
  { code:'FR', name:'France',         recommendedCurrency:'EUR', defaultTimeZone:'Europe/Paris',  timeZones:['Europe/Paris'], region:'other' },
  { code:'ES', name:'Spain',          recommendedCurrency:'EUR', defaultTimeZone:'Europe/Madrid', timeZones:['Europe/Madrid','Atlantic/Canary'], region:'other' },
  { code:'IT', name:'Italy',          recommendedCurrency:'EUR', defaultTimeZone:'Europe/Rome',   timeZones:['Europe/Rome'], region:'other' },
  { code:'NL', name:'Netherlands',    recommendedCurrency:'EUR', defaultTimeZone:'Europe/Amsterdam', timeZones:['Europe/Amsterdam'], region:'other' },
  { code:'CA', name:'Canada',         recommendedCurrency:'CAD', defaultTimeZone:'America/Toronto',
    timeZones:['America/St_Johns','America/Halifax','America/Toronto','America/Winnipeg','America/Edmonton','America/Vancouver'], region:'other' },
  { code:'AU', name:'Australia',      recommendedCurrency:'AUD', defaultTimeZone:'Australia/Sydney',
    timeZones:['Australia/Sydney','Australia/Brisbane','Australia/Adelaide','Australia/Perth','Australia/Hobart','Australia/Darwin'], region:'other' },
  { code:'NZ', name:'New Zealand',    recommendedCurrency:'NZD', defaultTimeZone:'Pacific/Auckland', timeZones:['Pacific/Auckland'], region:'other' },
  { code:'AE', name:'United Arab Emirates', recommendedCurrency:'AED', defaultTimeZone:'Asia/Dubai', timeZones:['Asia/Dubai'], region:'other' },
  { code:'SG', name:'Singapore',      recommendedCurrency:'SGD', defaultTimeZone:'Asia/Singapore', timeZones:['Asia/Singapore'], region:'other' },
  { code:'ZA', name:'South Africa',   recommendedCurrency:'ZAR', defaultTimeZone:'Africa/Johannesburg', timeZones:['Africa/Johannesburg'], region:'other' },
];
// Sentinel for "my country isn't listed": code 'ZZ' — NO default currency; the UI forces an explicit currency pick.
export const COUNTRY_NOT_LISTED = { code:'ZZ', name:'Country not listed', region:'other' as const };

export function countryByCode(code?: string): CountryOption | null;    // null for 'ZZ'/unknown
export function currencyMeta(code?: string): CurrencyMeta;             // throws/falls back only for a known code
export function resolveTimeZone(country: CountryOption | null): { timeZone: string; source:'browser'|'country_default'; confirmed: boolean };
//  resolveTimeZone: browserTz = Intl…resolvedOptions().timeZone;
//    if country && country.timeZones.includes(browserTz) -> { browserTz,'browser',true }
//    else if country -> { country.defaultTimeZone,'country_default', country.timeZones.length===1 }
//    else (ZZ) -> { browserTz || 'UTC','country_default', false }   // review required
```
No "EU" pseudo-country; the Eurozone is its member countries. No silent USD: an unlisted country (`ZZ`) forces an explicit currency selection. `Business.currency`/`currencySymbol` widen to `string` (4.4); `formatMinorUnits` uses `minorUnitDigits` (4.7).

### 4.4 `src/types/business.ts` (MODIFY — fields added across batches 2/3-nofields/4/5)
```ts
// Batch 5:
export interface OperatingHours { [day: number]: { open: string; close: string } | { closed: true }; } // 0=Sun..6=Sat
export interface BusinessLocation {
  id: string; name: string; address: string; isPrimary: boolean;
  staffPin?: string;                    // CHANGED: now OPTIONAL (new branches created without one — D-pin)
  phoneNumber?: string;                 // Batch 5
  status?: 'active'|'archived';         // Batch 5 (undefined ⇒ 'active')
  timeZone?: string;                    // Batch 5 (branch override)
  operatingHours?: OperatingHours;      // Batch 5
  createdAt?: string;                   // Batch 5
}
/** What the branch UI/service EXPOSES — never includes staffPin (D-pin). */
export interface BranchView {           // Batch 5
  id: string; name: string; address: string; isPrimary: boolean;
  phoneNumber?: string; status: 'active'|'archived'; timeZone?: string; operatingHours?: OperatingHours; createdAt?: string;
  hasPin: boolean;                      // whether a PIN exists, WITHOUT revealing it
}

// Batch 4:
export interface SocialLinkConfig { url: string; enabled: boolean; }
export interface BusinessSocialLinks { googleReview?: SocialLinkConfig; instagram?: SocialLinkConfig; tiktok?: SocialLinkConfig; }

// Batch 4:
export type TrialStatus = 'trialing'|'expired'|'active_paid'|'canceled';

export interface Business {
  // …unchanged…
  currency: string;         // WIDENED from 'USD'|'INR' (Batch 2)
  currencySymbol: string;   // WIDENED (Batch 2)
  countryCode?: string;     // Batch 2
  category?: string;        // Batch 2 (OnboardingCategoryId)
  logoUrl?: string | null;  // Batch 2 (promote the ad-hoc cast)
  timeZoneSource?: 'browser'|'country_default'|'manual'; // Batch 2
  timeZoneConfirmed?: boolean;                           // Batch 2 (review state, D-tz)
  socialLinks?: BusinessSocialLinks;                     // Batch 4
  trialStatus?: TrialStatus;                             // Batch 4 (undefined ⇒ derive)
  // trialEndsAt unchanged
}
```

### 4.5 `src/types/loyalty.ts` (MODIFY — Batch 3) — `RewardType` defined here
```ts
export type RewardType = 'free_item'|'percentage_discount'|'fixed_amount'|'custom';
export interface LoyaltyProgramConfig {
  // …existing…
  rewardType: RewardType;        // default on read: 'custom'
  rewardValue?: number;          // percent 1..100 | minor-units int | unused
  expiryDays?: number | null;    // null/0 = never
}
export interface CustomerReward {
  // …existing: id, rewardDescription, voucherCode, unlockedAt, isRedeemed, redeemedAt?, redeemedByStaff?
  rewardType?: RewardType;       // snapshot (default 'custom')
  rewardValue?: number;          // snapshot
  expiresAt?: string | null;     // snapshot at unlock; null/undefined = never
}
```

### 4.6 Onboarding "initial services" + social event types
`InitialServiceDraft` (in `types/onboarding.ts`, Batch 2):
```ts
export interface InitialServiceDraft { id: string; name: string; priceMinor: number; category?: string; description?: string; }
// `id` is generated ONCE in the wizard and persisted in the draft (D-idem C7); priceMinor is integer minor units.
```
`src/types/social.ts` (CREATE — Batch 4):
```ts
export type SocialDestination = 'google_review'|'instagram'|'tiktok';
export interface SocialClickEvent {    // server-written; shape of a stored event
  id: string;            // 32-hex, assigned by the Worker
  businessId: string;
  destination: SocialDestination;
  timestamp: string;     // ISO-8601 UTC (server)
  locationId?: string;   // ONLY present if the Worker verified it against an active location
  source: 'public_card';
  // NOTE: NO memberId (data minimization, C5)
}
export interface SocialClickSummary { googleReview: number; instagram: number; tiktok: number; total: number; range: 'today'|'7d'|'30d'|'90d'|'all'; locationId?: string; }
```
Path: `businesses/{bizId}/socialClicks/{clickId}` — **written only by the Worker (service account)**; read by members.

**Event↔config destination mapping (C5):**
```ts
export const DESTINATION_TO_LINK: Record<SocialDestination, keyof BusinessSocialLinks> =
  { google_review:'googleReview', instagram:'instagram', tiktok:'tiktok' };
```
(Shared by the card beacon and the Worker so a correctly-enabled Google review is never rejected.)

### 4.7 Money formatting (CREATE `src/utils/money.ts` — Batch 2; re-exported by `types/cafe.ts`)
```ts
export function formatMinorUnits(amountMinor: number, currencyOrSymbol: string): string;
//   resolve ISO code -> {symbol,minorUnitDigits} via CURRENCIES; else treat arg as a literal symbol with 2 digits.
//   INR: drop ".00" when whole (display-only; storage unchanged).
export function toMinor(amountMajor: number, currencyCode: string): number;  // round(major * 10^digits)
export function toMajor(amountMinor: number, currencyCode: string): number;  // minor / 10^digits
```
`src/types/cafe.ts#formatMinorUnits` is **re-exported** from `money.ts` (all existing imports keep working — KEEP call sites).

---

## 5. Firestore changes

### 5.1 Field additions (additive; read-time defaults; no migration script)
| Path | Field(s) | Default-on-read |
|---|---|---|
| `businesses/{id}` | `countryCode`,`category`,`logoUrl`,`currency/currencySymbol`(widened),`timeZoneSource`,`timeZoneConfirmed`,`socialLinks`,`trialStatus` | `category`←from engine; `trialStatus`←derive; `timeZoneConfirmed`←treat missing as `true` for legacy; others `undefined` |
| `businesses/{id}.locations[]` | `phoneNumber`,`status`,`timeZone`,`operatingHours`,`createdAt`; `staffPin` now optional | `status`←`'active'` |
| `config/loyaltyProgram` | `rewardType`,`rewardValue`,`expiryDays` | `rewardType`←`'custom'`; `expiryDays`←`null` |
| `customers/{id}.rewards[]` + mirror `memberCards/{id}.rewards[]` | `rewardType`,`rewardValue`,`expiresAt` | `expiresAt`←`null` |
| `publicProfiles/{id}` | **add** `socialLinks`(enabled+valid only),`logoUrl`; **remove** `timeZone`,`selectedModules`; locations filtered to non-archived `{id,name,address,isPrimary}` | — |
| `businesses/{id}/socialClicks/{clickId}` | **new collection** (server-written, no `memberId`) | — |

### 5.2 Security-rule implications — **documented in Batches 1–5, applied only in Batch 6 (D-rulesphase, C12)**
Required changes (to be consolidated in Batch 6):
1. `businesses/{id}/socialClicks/{clickId}`: `allow read: if isMember(bizId);` and `allow create,update,delete: if false;` (Worker writes via SA, bypassing rules — defense in depth). *Until Batch 6, the existing catch-all `/{other}/{id}` already yields member-read + manager-write; no client code writes this path, and the Worker bypasses rules, so Batches 1–5 function without a rule edit and introduce no violating client access.*
2. Business-update immutability: add `trialStatus` and `trialEndsAt` to the client-immutable field set so a manager client cannot self-extend the trial. *No client UI writes these; deferring to Batch 6 introduces no new exposure.*
3. No rule change needed for reward expiry (render/redeem-time) or branches (still business-doc fields). `publicProfiles` projection change is code-side (`toPublicProfile`), not a rule change.
**Batches 1–5 must not weaken any existing rule to make a feature work; if a feature would require a client write the current rules forbid, that write goes through the Worker instead.**

### 5.3 Indexes (`firestore.indexes.json`) — applied in Batch 6 with the rules
Dashboard counts use aggregation queries (§6.4). Required composite indexes:
```json
{ "collectionGroup":"socialClicks","queryScope":"COLLECTION",
  "fields":[{"fieldPath":"destination","order":"ASCENDING"},{"fieldPath":"timestamp","order":"ASCENDING"}] },
{ "collectionGroup":"socialClicks","queryScope":"COLLECTION",
  "fields":[{"fieldPath":"locationId","order":"ASCENDING"},{"fieldPath":"destination","order":"ASCENDING"},{"fieldPath":"timestamp","order":"ASCENDING"}] }
```
Also ensure the existing `invites.email` override is deployed (a prior runtime error showed it missing in the live project).

### 5.4 Migration / backward compatibility
No migration script. All reads apply defaults (§5.1). Public-profile re-projection happens on the next business save (lazy); no bulk backfill. Legacy `timeZoneConfirmed` missing is treated as confirmed (don't nag existing businesses).

---

## 6. Security and trusted-endpoint design

### 6.1 Pre-existing findings — re-verified STILL PRESENT (not fixed here)
1. **Plaintext staff PINs** on `businesses/{id}.locations[].staffPin`, verified client-side. Not leaked publicly (`toPublicProfile` strips them — verified). Residual: any member can read all branch PINs; PINs are 4-digit. **This pass must not widen it** (D-pin): no PIN UI, no PIN in branch responses, new branches PIN-less. True fix (hashed + server verify) = security phase.
2. **Untrusted client mutations** (stamp/redeem/order) via `bizStore`/rules. Existing property; not fixed here. The `/social-click` Worker establishes the trusted-mutation pattern to extend later.

### 6.2 Worker `POST /social-click` — complete contract (C5)
Add a second route to `worker/src/index.ts` (keep `/upload` untouched). **Unauthenticated** (customers aren't signed in), abuse-controlled, server-writes the event.

**CORS / preflight**
- `OPTIONS /social-click` → `204` with CORS headers (mirror the existing `/upload` handler).
- Allowed origins = `env.ALLOWED_ORIGINS` (comma list). Allowed methods = `POST, OPTIONS`. Allowed headers = `Content-Type`.
- Response headers on **every** response (including errors): `Access-Control-Allow-Origin` (echo if allowed, else first allowed), `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Vary: Origin`.
- A request whose `Origin` is not in the allowlist → `403 {error:'origin_not_allowed'}` **with** CORS headers.

**Request**
```
POST {WORKER_BASE}/social-click
Origin: <allowlisted>
Content-Type: application/json
{ "businessId":"<id>", "destination":"google_review|instagram|tiktok",
  "locationId":"<loc_… | omitted>", "turnstileToken":"<token | omitted>" }
```
(No `memberId` — removed for data minimization.)

**Validation (server, in order)**
1. Method `POST`; `Origin` allowlisted (else 403).
2. Body: `businessId` matches `^[a-zA-Z0-9_-]{4,64}$`; `destination ∈ {google_review,instagram,tiktok}`; `locationId` (if present) matches `^loc_[a-zA-Z0-9]{1,32}$`.
3. **Destination enabled:** fetch `publicProfiles/{businessId}` (public REST read, no auth). Using `DESTINATION_TO_LINK[destination]`, require `socialLinks[prop]` to be a present `https` URL. Else `404 {error:'destination_not_enabled'}`.
4. **Branch verification (C5):** if `locationId` is present, it must equal the `id` of an entry in `publicProfiles.locations` (which already excludes archived). If it does **not** match, **drop it** and record the event as **unattributed** (no `locationId`) — never trust a client branch id. (Precise rule: verified → attributed; unverified/absent → unattributed.)
5. **Rate limiting (operational, §6.3).** Over-limit → `429 {error:'rate_limited'}`.
6. **Turnstile policy:** if `env.TURNSTILE_SECRET` is configured, the Worker **verifies** `turnstileToken` via Cloudflare siteverify; a missing/invalid token when verification is required → `403 {error:'challenge_required'}`. Mere token presence is never treated as proof (the Worker always verifies). If Turnstile is not configured, rely on rate limiting + origin allowlist (documented as weaker; see §6.3).
7. **Write:** `clickId = 32 lowercase hex` (server-generated); `timestamp = server ISO`. Write `businesses/{businessId}/socialClicks/{clickId}` via the Firestore REST API using a **service-account OAuth token** (§6.5). SA writes bypass rules, so `socialClicks` stays client-unwritable.

**Responses**
`200 {ok:true}` · `400 {error:'bad_request'}` · `403 {error:'origin_not_allowed'|'challenge_required'}` · `404 {error:'destination_not_enabled'}` · `429 {error:'rate_limited'}` · `500 {error:'server_error'}` — all with CORS headers.

**Client behaviour & duplicates/retries:** the card opens the external link immediately and fires the POST **fire-and-forget** (`fetch(url,{method:'POST',keepalive:true,…}).catch(()=>{})`), with a per-destination `localStorage` debounce (1 tap / 15 min). The model is **append-only, at-least-once**: a network retry may create a second event. Exact de-duplication is **out of scope** (documented); duplicates are bounded by the client debounce + rate limiting, and the dashboard reports taps as an approximate engagement signal (never a conversion). (Optional future hardening: a client idempotency nonce de-duped in Workers KV within a short TTL — not required now.)

### 6.3 Rate limiting — concrete operational setup (C5)
- **Primary:** a **Cloudflare Rate Limiting Rule** (dashboard/Terraform) on `/social-click`, e.g. *≤ 30 requests / 10 min / client IP* → block/challenge. Origin validation is **not** authentication and is stated as such.
- **Secondary (optional):** Cloudflare **Turnstile**. Challenge policy: invisible/managed widget on the public card; the Worker **verifies** the token server-side when `TURNSTILE_SECRET` is set. Without Turnstile, protection = rate limiting + origin allowlist only (explicitly weaker; acceptable for a low-value "tap count" metric).
- The Worker itself does no stateful counting (stateless); all throttling is at the Cloudflare edge.

### 6.4 Dashboard aggregation — counts, not raw loads (C6)
Chosen architecture: **Firestore aggregation `getCountFromServer`** from the member's authenticated client (rules allow member read → aggregation permitted). For each destination `d` and the selected range window `[from, now]`:
```ts
getCountFromServer(query(coll(businesses/{id}/socialClicks),
  where('destination','==',d), where('timestamp','>=',fromIso) [, where('locationId','==',loc)]))
```
- **Read cost:** aggregation bills ~1 document read per up-to-1000 matched index entries per query (far cheaper than reading events). A dashboard view runs ≤ 3 destination counts × {all-branches | one branch} — a bounded handful of aggregation reads, independent of total event volume. **The dashboard never pages raw events to show totals.**
- **Indexes:** the two composite indexes in §5.3.
- **Branch aggregation:** add `where('locationId','==',loc)`; **all-branches:** omit it (note: unattributed events are counted in all-branches, not in any specific branch — consistent with §6.2 step 4).
- **Duplicates/retry:** reflected as a slight overcount, bounded as in §6.2.
- **Historical reporting:** range windows (`today/7d/30d/90d/all`) via the `timestamp` filter.
- **Retention:** optional **Firestore TTL policy** on `socialClicks.timestamp` (e.g., 400 days) — documented, not required; set in the Firebase console, not in client code.
- **Business isolation:** subcollection path + member-only read; one business can never read another's clicks.
- **Rejected alternatives:** reading all events into memory (unbounded — the problem being fixed); client-maintained counters on `publicProfiles` (anonymous-writable/forgeable); Worker-maintained daily rollup docs (adds SA read-modify-write complexity; keep as a *future* optimization if count() ever proves insufficient).

### 6.5 Service-account credential — honest scope & secret handling (C5)
- The Worker writes to Firestore REST with a **dedicated Google service account** granted **`roles/datastore.user`** (read/write Firestore). **Be explicit:** this IAM role grants project-wide Firestore write; **Firestore does not provide IAM document-path-level restriction**, so the credential's blast radius is "any Firestore write in the project" if leaked. We do **not** claim path-level restriction. Least-privilege achievable = a *dedicated* SA used only by the Worker (not Owner/Editor), nothing else using it.
- **Secrets are never in the repo.** Bindings, set via **`wrangler secret put`** (or the Cloudflare dashboard → Worker → Settings → Variables → Encrypted):
  - `FIREBASE_SA_CLIENT_EMAIL`
  - `FIREBASE_SA_PRIVATE_KEY`
  - `TURNSTILE_SECRET` (optional)
  - (reuse existing `FIREBASE_PROJECT_ID`, `ALLOWED_ORIGINS`)
- No service-account JSON, private key, or secret value appears in any tracked source file, example, or prompt.
- **Rotation:** rotate the SA key periodically and on suspected exposure: create a new key, `wrangler secret put` the new values, delete the old key in Google Cloud. Document this in the Batch 5 report (ops), not in code.

---

## 7. File-by-file inventory (CREATE / MODIFY / KEEP / RETIRE)

### 7.1 Summary table
| Path | Class | Batch | Change |
|---|---|---|---|
| `src/pages/SignupPage.tsx` | MODIFY | 1 | remove region/pricing; neutral "Start your free trial" (no duration); seed `pendingBusinessId` |
| `src/pages/LoginPage.tsx` | MODIFY | 1 | remove "30-day"/pricing copy; keep auth/reset/redirect |
| `src/services/authService.ts` | MODIFY | 1 | seed `pendingBusinessId` in default draft; **do not** set reward fields (types not defined yet) |
| `PricingSelectorPage/UsaPricingPage/IndiaPricingPage` | KEEP | 1 | public pricing unchanged |
| `src/data/onboardingCategories.ts` | CREATE | 2 | 8-card + subtypes mapping (existing icons only) |
| `src/data/countriesData.ts` | CREATE | 2 | accurate country/currency/timezone + `resolveTimeZone` |
| `src/utils/money.ts` | CREATE | 2 | `formatMinorUnits`/`toMinor`/`toMajor`; re-exported by `types/cafe.ts` |
| `src/types/onboarding.ts` | MODIFY | 1→2→3 | add fields per batch (see §4.1); `OnboardingCategoryId`, `InitialServiceDraft` in Batch 2 |
| `src/types/business.ts` | MODIFY | 2/4/5 | widen currency; `countryCode/category/logoUrl/timeZoneSource/timeZoneConfirmed`(2), `socialLinks/TrialStatus/trialStatus`(4), `BusinessLocation` fields + `staffPin?` + `BranchView`(5) |
| `src/pages/OnboardingPage.tsx` | MODIFY | 2,3 | 5-step restructure; remove Modules; hidden TZ; idempotent submit |
| `src/components/onboarding/BusinessTypeCards.tsx` | CREATE | 2 | 8 cards + optional subtype chips |
| `src/components/onboarding/CountryCurrencyField.tsx` | CREATE | 2 | country select → recommended currency (changeable); `ZZ` forces explicit currency; no TZ/price |
| `src/components/onboarding/OtherServicesSetup.tsx` | CREATE | 2 | optional initial services; each row gets a stable `id` |
| `src/services/businessService.ts` | MODIFY | 2,3,4,5 | idempotent `createBusiness`; `toPublicProfile` projection; `updateSocialLinks` (batch); **transactional** branch CRUD returning `BranchView` (no PIN); `getTrialState`; TZ fields |
| `src/services/genericService.ts` | MODIFY | 2 | add `upsertService(businessId, {id,…})` for idempotent initial services (reuse existing create) |
| `src/lib/uploads.ts` | KEEP | 2 | logo upload already supported |
| `src/data/onboardingData.ts` | MODIFY (minor) | 2 | keep `BUSINESS_TYPES` defaults; stop requiring modules |
| `src/types/loyalty.ts` | MODIFY | 3 | **define `RewardType`**; program + reward fields |
| `src/services/loyaltyService.ts` | MODIFY | 3 | default program reward fields; snapshot `expiresAt` at unlock (+ mirror); redeem expiry check; `saveProgram` fields |
| `src/utils/loyaltyRewards.ts` | CREATE | 3 | reward validation + expiry/label helpers |
| `src/components/onboarding/RewardConfigStep.tsx` | CREATE | 3 | reward type/value(major→minor)/description/expiry UI |
| `src/components/onboarding/LoyaltyCardPreview.tsx` | MODIFY | 3 | reflect reward type/value/expiry |
| `src/components/onboarding/FinalReviewCard.tsx` | CREATE | 3 | full summary + edit-back + idempotent submit |
| `src/components/dashboard/SettingsView.tsx` | MODIFY | 3,4,5 | loyalty tab (structured reward); new "Reviews & Social" tab (calls `businessService.updateSocialLinks`); locations tab branch CRUD/archival (no PIN) + TZ-review banner |
| `src/components/dashboard/loyalty/LoyaltyProgramEditModal.tsx` | MODIFY | 3 | structured reward editing |
| `src/pages/PublicLoyaltyCardPage.tsx` | MODIFY | 4,5 | render enabled social links + reward expiry; beacon in Batch 5 |
| `src/components/public/SocialLinksRow.tsx` | CREATE | 4 | accessible pill row; secure links; `onBeacon?` hook (wired Batch 5) |
| `src/utils/socialUrls.ts` | CREATE | 4 | per-channel https + host validation |
| `src/types/social.ts` | CREATE | 4 | `SocialDestination`, `SocialClickEvent` (no memberId), `SocialClickSummary`, `DESTINATION_TO_LINK` |
| `src/services/socialAnalyticsService.ts` | CREATE | 5 | `getClickSummary` via `getCountFromServer` (no raw load) |
| `src/components/dashboard/growth/AnalyticsView.tsx` | MODIFY | 5 | social taps card; branch filter |
| `src/services/growthService.ts` | MODIFY | 5 | optional `locationId` filter in analytics |
| `src/components/dashboard/BusinessSwitcherModal.tsx` | MODIFY | 5 | hide archived branches |
| `src/components/dashboard/settings/BranchEditModal.tsx` | CREATE | 5 | add/edit branch (name/address/phone/hours/status/TZ) — **no PIN field** |
| `worker/src/index.ts` | MODIFY | 5 | add `POST /social-click` + `OPTIONS`; SA write; destination/branch validation; CORS |
| `src/pages/PublicLoyaltyCardPage.tsx` / `SocialLinksRow.tsx` | MODIFY | 5 | wire the Worker beacon + debounce |
| `firestore.rules` | **MODIFY in Batch 6 only** | 6 | socialClicks (member read, client-deny) + trial-immutable fields |
| `firestore.indexes.json` | **MODIFY in Batch 6 only** | 6 | socialClicks composite indexes; confirm `invites.email` |
| `src/App.tsx` | KEEP | — | routes already exist (`/card`,`/services`,`/onboarding`) |
| all other service/view files | KEEP | 6 | regression targets |

**RETIRE:** none. **REMOVED vs Rev. 1:** `src/services/socialLinksService.ts` (writer) is **not created** — the save path is `businessService.updateSocialLinks` (C4). Validation lives in `socialUrls.ts`; projection in `toPublicProfile`.

### 7.2 Detailed CREATE/MODIFY specs (only files whose contract changed in Rev. 2 are re-stated in full; others as in §7.1 + the contracts in §4/§8)

#### 7.2.A `src/services/businessService.ts` — MODIFY
- **`createBusiness(data)` — idempotent (D-idem):** `businessId = data.pendingBusinessId ?? newId()`. If `businesses/{businessId}` exists and `ownerUid === user.id` → **resume** (idempotent `setDoc` of slug/profile/config as needed; then ensure initial services via `upsertService`; return). Else create with `countryCode`, widened `currency/currencySymbol`, `category`, `logoUrl`, derived `timeZone`+`timeZoneSource`+`timeZoneConfirmed` (from `resolveTimeZone`), `trialEndsAt`, `trialStatus:'trialing'`, primary location `{…, status:'active', createdAt}` (primary keeps its generated `staffPin` for back-compat). Reuse `data.reservedSlug` if set; else `reserveSlug` once and persist to the draft before continuing. Then idempotent `setDoc(publicProfiles)` + `setDoc(config/loyaltyProgram, {…rewardType,rewardValue,expiryDays})`. For "Other", `genericService.upsertService` for each `data.initialServices` (deterministic ids).
- **`toPublicProfile(biz)` (MODIFY):** add `logoUrl`; add `socialLinks` = `projectSocialLinks(biz)` (enabled+valid only); filter `locations` to `status!=='archived'` → `{id,name,address,isPrimary}`; **remove `timeZone` and `selectedModules`**; continue to exclude `staffPin/contactEmail/ownerUid/memberUids/members`.
- **`updateSocialLinks(businessId, next: BusinessSocialLinks): Promise<void>` (NEW, C4):** load the current full `Business` from `memberBusinesses` (if absent, `getDoc(businesses/{id})`). Validate each **enabled** link via `socialUrls.validateSocialUrl`; reject with an honest error otherwise. Build `merged = { ...current, socialLinks: next }`. In **one `writeBatch`**: `batch.update(businesses/{id}, { socialLinks: next })` and `batch.set(publicProfiles/{id}, toPublicProfile(merged))`; `commit()`. Atomic → private config and public projection never diverge on a partial failure. `projectSocialLinks(biz)` returns `{googleReview?,instagram?,tiktok?}` using only enabled+valid URLs (used by `toPublicProfile`).
- **Branch CRUD — transactional (C8), PIN-free (C3):** all four run in `runTransaction`:
  - `addLocation(businessId, input: { name; address; phoneNumber?; timeZone?; operatingHours? }): Promise<BranchView>` — tx reads the business, appends `{ id:'loc_'+randomString(8), name, address, phoneNumber?, isPrimary:false, status:'active', createdAt, timeZone?, operatingHours? }` (**no staffPin**), writes back the array; after commit re-`setDoc(publicProfiles)`. Returns a `BranchView` (`hasPin:false`).
  - `updateLocation(businessId, locationId, patch: Partial<Pick<BusinessLocation,'name'|'address'|'phoneNumber'|'timeZone'|'operatingHours'>>): Promise<BranchView>` — tx read-modify-write the single entry; **patch may not include `staffPin`** (type-enforced); re-project.
  - `archiveLocation(businessId, locationId)` — tx set `status:'archived'`; **refuse if it is the only active location** (throw); if the active-context points to it, move context to another active branch; re-project (archived excluded).
  - `reactivateLocation(businessId, locationId)` — tx set `status:'active'`; re-project.
  - **Read API:** `listBranches(businessId): BranchView[]` maps locations → `BranchView` (`hasPin = !!loc.staffPin`), **never returning `staffPin`**.
  - **`updateBusiness` PIN validation relaxed:** validate `staffPin` format **only for locations that have one** (PIN-less branches are valid).
- **`getTrialState(biz): { status: TrialStatus; daysLeft: number; isActive: boolean }`** per D-trial (no gate).
- **Tests (unit):** idempotent create (same `pendingBusinessId` → same id; resume path); `toPublicProfile` excludes PIN/timeZone/selectedModules/archived; `updateSocialLinks` writes both docs atomically and omits disabled/invalid; branch tx add/update/archive/reactivate; archive refuses last active; `listBranches` never returns `staffPin`.
- **Acceptance:** §15.

#### 7.2.B `src/services/genericService.ts` — MODIFY (C7)
- Add `upsertService(businessId, input: { id: string; name: string; priceMinor: number; category?: string; description?: string }): Promise<void>` → `setDoc(businesses/{id}/serviceItems/{input.id}, {…, isActive:true, createdAt})` (idempotent; reuses the existing catalogue shape). Existing `createService` (random id) is unchanged for dashboard use. **Tests:** calling `upsertService` twice with the same id yields one doc.

#### 7.2.C `src/services/socialAnalyticsService.ts` — CREATE (C6)
- `getClickSummary(businessId, range, locationId?): Promise<SocialClickSummary>` using `getCountFromServer` per destination with the range `timestamp>=` filter (+ optional `locationId==`). `subscribe()` optional (dashboard may just re-query on range/branch change). **No raw-event loads.** **Tests:** mock the aggregation layer; verify per-destination/range/branch query shapes and summary assembly.

#### 7.2.D `worker/src/index.ts` — MODIFY (C5)
- Implement §6.2 exactly: `OPTIONS` + `POST /social-click`; CORS on all responses; destination-enabled check via `publicProfiles`; `locationId` verified against active `publicProfiles.locations` (else unattributed); rate-limit handled at Cloudflare (Worker returns 429 if it detects CF's signal/exceeds its own simple guard); optional Turnstile **verification**; SA write via Firestore REST with `FIREBASE_SA_CLIENT_EMAIL`/`FIREBASE_SA_PRIVATE_KEY`; 32-hex `clickId`; server timestamp; **no `memberId`**. Keep `/upload` intact. **Tests ([W]):** valid→200+write; disabled→404; bad origin→403; bad body→400; over-limit→429; unverified `locationId`→event written unattributed. **Report:** include the `wrangler secret put` names and the SA role/rotation note (no secret values).

#### 7.2.E `src/components/dashboard/settings/BranchEditModal.tsx` — CREATE (C3, C8)
- Props `{ businessId; branch?: BranchView; onClose; onSaved }`. Fields: name, address, phone, operating hours, optional timezone, status. **No PIN field.** Calls `businessService.addLocation/updateLocation`. Shows an inline note: *"Branch staff PIN setup is coming with secure PIN management."* **Acceptance:** add/edit work without touching PINs; archived/reactivate via the locations list; never displays a PIN.

#### 7.2.F Social settings tab (in `SettingsView.tsx`) — MODIFY (C4)
- New `'reviews-social'` tab: three channel rows (URL + independent toggle); validate via `socialUrls`; save via **`businessService.updateSocialLinks`** (single method). Disabling keeps the URL. **No separate social service.**

> All other CREATE/MODIFY entries keep their Rev. 1 responsibilities, adjusted only where a contract above supersedes them (e.g., `PublicLoyaltyCardPage` beacon moves to Batch 5; `SettingsView` locations tab is PIN-free).

---

## 8. TypeScript interfaces and service contracts (consolidated — authoritative)

```ts
// businessService (Batches 2–5)
createBusiness(data: OnboardingData): Promise<Business>;                         // idempotent
updateSocialLinks(businessId: string, next: BusinessSocialLinks): Promise<void>; // atomic batch (C4)
listBranches(businessId: string): BranchView[];                                  // never returns staffPin
addLocation(businessId: string, input: NewBranchInput): Promise<BranchView>;     // transactional, PIN-free
updateLocation(businessId: string, locationId: string, patch: BranchPatch): Promise<BranchView>; // no staffPin in patch
archiveLocation(businessId: string, locationId: string): Promise<void>;          // refuses last active
reactivateLocation(businessId: string, locationId: string): Promise<void>;
getTrialState(biz: Business): { status: TrialStatus; daysLeft: number; isActive: boolean };
// toPublicProfile(biz) internal; projection per §5.1
// NewBranchInput = { name; address; phoneNumber?; timeZone?; operatingHours? }   // no staffPin
// BranchPatch    = Partial<Pick<BusinessLocation,'name'|'address'|'phoneNumber'|'timeZone'|'operatingHours'>> // no staffPin

// genericService (Batch 2)
upsertService(businessId: string, input: { id: string; name: string; priceMinor: number; category?: string; description?: string }): Promise<void>;

// loyaltyService (Batch 3) — signatures unchanged; behaviour extended
saveProgram(businessId: string, updates: Partial<LoyaltyProgramConfig>): LoyaltyProgramConfig; // accepts rewardType/rewardValue/expiryDays
// issueStamp snapshots expiresAt/rewardType/rewardValue (+ memberCards mirror); redeemReward rejects expired

// socialAnalyticsService (Batch 5)
getClickSummary(businessId: string, range: 'today'|'7d'|'30d'|'90d'|'all', locationId?: string): Promise<SocialClickSummary>; // getCountFromServer

// utils
validateRewardConfig(input): { ok:true } | { ok:false; field:string; message:string };   // Batch 3
computeExpiresAt(unlockedAtISO: string, expiryDays?: number|null): string|null;           // Batch 3
isRewardExpired(reward: CustomerReward): boolean;                                         // Batch 3
validateSocialUrl(destination: SocialDestination, url: string): { ok:true; url:string } | { ok:false; message:string }; // Batch 4
resolveTimeZone(country: CountryOption|null): { timeZone:string; source:'browser'|'country_default'; confirmed:boolean }; // Batch 2
formatMinorUnits(amountMinor: number, currencyOrSymbol: string): string;                  // Batch 2
toMinor(amountMajor: number, currencyCode: string): number; toMajor(amountMinor: number, currencyCode: string): number;  // Batch 2
```
**Conventions:** member-mode collection writes use existing `bizStore` where a spec exists; `businesses/{id}` + `publicProfiles/{id}` use direct `setDoc`/`updateDoc`; **branch mutations and the social-links save use transactions/batches** (C4/C8); slug remains a `runTransaction`; `socialClicks` are written **only** by the Worker.

---

## 9. Component behaviour and integration map

```
Signup/Login (neutral) → authService (draft incl. pendingBusinessId)
OnboardingPage
  ├─ BusinessTypeCards (8 cards + optional subtype) → category + engine (onboardingCategories)
  ├─ CountryCurrencyField → countriesData (recommendedCurrency, resolveTimeZone, ZZ=explicit currency)
  ├─ OtherServicesSetup (engine==='service') → draft initialServices[].id (stable)
  ├─ RewardConfigStep (validateRewardConfig; major→minor via toMinor)
  └─ FinalReviewCard → businessService.createBusiness (idempotent) → genericService.upsertService×N
Dashboard › Settings
  ├─ Loyalty tab → loyaltyService.saveProgram (structured reward)
  ├─ Reviews & Social tab → businessService.updateSocialLinks (atomic batch; socialUrls validation)
  └─ Locations tab → BranchEditModal (no PIN) → businessService.add/update/archive/reactivateLocation (transactional); TZ-review banner
Public card → reads publicProfiles.socialLinks + memberCards reward.expiresAt
  └─ SocialLinksRow → beacon → Worker /social-click → (SA) businesses/{id}/socialClicks  (no memberId)
Dashboard › Analytics
  ├─ branch filter → growthService.getGrowthAnalytics(…, locationId)
  └─ Social taps card → socialAnalyticsService.getClickSummary (getCountFromServer)
BusinessSwitcherModal → active location (excludes archived)
```

---

## 10. Implementation batches (order 1→6, strict)

| Batch | Creates | Modifies | Must not change | Rules |
|---|---|---|---|---|
| 1 Neutral entry | — | SignupPage, LoginPage, authService | pricing pages; auth/verify | none |
| 2 Type & details | onboardingCategories, countriesData, money, BusinessTypeCards, CountryCurrencyField, OtherServicesSetup | onboarding types(1→2), business types(2), OnboardingPage, businessService(create/profile), genericService(upsert), onboardingData, types/cafe(re-export) | engine ids; dashboard views | none (document) |
| 3 Rewards & review | loyaltyRewards, RewardConfigStep, FinalReviewCard | loyalty types(define RewardType), loyaltyService, LoyaltyCardPreview, SettingsView(loyalty), LoyaltyProgramEditModal, OnboardingPage(review) | issued vouchers; stamp math | none |
| 4 Social settings & card | SocialLinksRow, socialUrls, types/social | business types(social/trial), businessService(updateSocialLinks/toPublicProfile), SettingsView(tab), PublicLoyaltyCardPage(links+expiry) | public-profile privacy boundary | **document only** |
| 5 Clicks & branches | socialAnalyticsService, BranchEditModal | worker, AnalyticsView, growthService, SettingsView(locations), BusinessSwitcherModal, business types(location fields), businessService(branch tx), PublicLoyaltyCardPage/SocialLinksRow(beacon) | business-wide CRM/loyalty scope; `/upload` route; **no PIN UI** | **document only** |
| 6 Rules/regression/security | — | **firestore.rules (consolidated)**, firestore.indexes.json, (bug fixes only) | no new feature files; no engine renames | **applied here; emulator-validated; no auto-deploy** |

Rollback: each batch is feature-additive and independently revertable. The Worker (Batch 5) deploys separately from the SPA; until it's live, the card simply doesn't beacon (links still work).

### 10.1 Batch dependency table (C1) — what must exist before each batch; independent compilation
| Batch | Pre-existing types/files required | New types introduced | `OnboardingData` fields added | Compiles independently? |
|---|---|---|---|---|
| 1 | current tree | — | `pendingBusinessId?`, `reservedSlug?` | ✅ (no reward/country types referenced) |
| 2 | Batch 1 | `OnboardingCategoryId`, `InitialServiceDraft`, `CountryOption/CurrencyMeta`, widened `Business.currency`, `timeZoneSource/timeZoneConfirmed` | `category?`, `countryCode?`, `currency?`, `currencySymbol?`, `logoUrl?`, `initialServices?`; relax `selectedModules?/contactEmail?/…` | ✅ (**no** `RewardType` import) |
| 3 | Batch 2 | **`RewardType`** (in `types/loyalty.ts`), program+reward fields | `rewardType?`, `rewardValue?`, `expiryDays?` (now imports `RewardType`) | ✅ (RewardType now defined) |
| 4 | Batch 3 | `SocialLinkConfig`, `BusinessSocialLinks`, `TrialStatus`, `SocialDestination`, `SocialClickEvent`, `SocialClickSummary`, `DESTINATION_TO_LINK` | — | ✅ |
| 5 | Batch 4 | `OperatingHours`, `BusinessLocation` fields, `BranchView`, `NewBranchInput/BranchPatch` | — | ✅ |
| 6 | Batches 1–5 | — | — | ✅ (rules/regression only) |

**Rule for Antigravity:** no batch may `import` a type, function, service or file introduced in a later batch. `RewardType` does not exist until Batch 3; Batch 1 must **not** set `rewardType`/`expiryDays` on any typed object.

---

## 11. Antigravity prompts
Six copy-ready prompts are in **`ANTIGRAVITY_PROMPTS.md`** (same folder), revised in lock-step with Rev. 2: batch dependencies (C1), no-forward-type-refs, PIN-free branches (C3), single social-save method (C4), full Worker contract (C5), aggregation analytics (C6), idempotent services (C7), transactional branches (C8), money precision (C9), truthful trial (C10), compact categories (C11), and **rules only in Batch 6** (C12).

---

## 12. Test matrix
**[A]** automated/unit · **[M]** manual QA · **[W]** worker.

**Account (Batch 1):** [M] Google/email signup+verify, login, reset; [M] no `$`/`₹`/plan/duration at `?region=usa|india|absent`; [A] default draft has `pendingBusinessId`, **no** `rewardType/expiryDays`; [M] existing account → dashboard; interrupted verify recovers.

**Onboarding (Batches 2–3):** [M] 8 cards + optional subtype; [A] `categoryToEngine` all ids → valid engine; [M] "Other"/subtype shows optional services (skippable); [M] name required; logo upload + initials fallback; [A] country→currency (IN→₹INR; **ZZ forces explicit currency, no silent USD**); [A] `resolveTimeZone` (browser tz in-country → used/confirmed; else default + review flag); [M] **no timezone field**; [M] threshold presets+custom; [A] every reward type validated; money major→minor once; [M] "Never expires" default; [M] review accurate; back-nav preserves; [A]/[M] double submit & refresh → one business; [A] resume creates only missing initial services (no dupes); [M] interrupted flow resumes.

**Rewards (Batch 3):** [A] unlock `expiryDays:30`→`expiresAt≈+30d`; `null`→never; legacy voucher→never; expired redemption rejected; valid redemption ok; program edit doesn't alter issued vouchers or stamps; `fixed_amount` stored as minor units.

**Social (Batch 4–5):** [M] three valid save; [A] invalid rejected per channel (http/wrong host); [M] independent toggles (disable keeps URL); [A] `updateSocialLinks` writes both docs atomically, omits disabled/invalid, preserves other public-profile fields; [M] public card shows exactly enabled+valid; secure new-tab; [W] `/social-click`: valid→200+write; disabled→404; bad origin→403; over-limit→429; **unverified `locationId`→unattributed write**; **no `memberId` stored**; [M] dashboard counts via aggregation + range filter + branch attribution; [M] copy = taps (never reviews/follows).

**Branches (Batch 5):** [M] create/edit/archive/reactivate (no PIN shown anywhere); [A] archive refuses last active; [A] **concurrent branch edits don't lose updates** (transaction test); [A] `listBranches` never returns `staffPin`; [M] switch context; [M] shared loyalty across branches; [M] branch vs business-wide analytics; business-wide CRM never hidden by branch filter.

**Regression (Batch 6):** [M] café/restaurant (menu+tables+orders+KDS), salon (services+staff+booking+calendar), retail (catalogue), gym (members+check-in+classes), carwash (services+bundles+passes), generic services; `/card,/menu,/book,/catalog,/services`; order+booking; loyalty/CRM; mobile+themes. [A] `npx tsc -b` + `npm run lint` + `npx vite build` green. [W]/[emulator] final rules validated.

---

## 13. Migration and compatibility strategy
- **No migration script.** Read-time defaults everywhere (§5.1). Public-profile re-projection is lazy (next save). Legacy `timeZoneConfirmed` missing ⇒ treated confirmed (no nag).
- **Currency widening:** existing `'USD'|'INR'` are a subset of `string`; `formatMinorUnits` re-export keeps all call sites. New currencies declare `minorUnitDigits` (all 2 now).
- **Public projection:** dropping `timeZone`/`selectedModules` is safe — verify no public page reads them before removal (grep in Batch 4).
- **Rewards:** old programs → `custom`; old vouchers → never; new unlocks snapshot new fields.
- **Locations:** old locations → `status:'active'`; `staffPin` now optional (existing PINs retained; new branches PIN-less). `updateBusiness` PIN validation only applies to locations that carry a PIN.
- **Deploy order:** SPA (Batches 1–4) can ship before the Worker (Batch 5). Rules + indexes ship in Batch 6 (manual paste); until then the system runs on existing rules without violation.

---

## 14. Risk register
| # | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R1 | Idempotent-create refactor blocks new signups | M | H | [A] same `pendingBusinessId`→same id; resume path tests; manual double-submit QA |
| R2 | Currency widening breaks a vertical's formatting | M | M | single `formatMinorUnits`+re-export; [A] USD/INR/GBP/EUR; Batch 6 regression |
| R3 | Public-profile projection drops a field a public page used | L | M | grep public pages before removal; keep `logoUrl` |
| R4 | Click endpoint abused / mis-scoped | M | M | Worker validation + CF rate-limit + optional Turnstile verify + SA-only writes; counts are aggregation-based |
| R5 | Editing loyalty program corrupts issued vouchers | L | H | snapshot-at-unlock preserved; [A] program edit doesn't touch rewards |
| R6 | Archiving a branch breaks history / hides CRM | L | M | soft-archive only; transactional; branch filter scoped to operational metrics (D-scope) |
| R7 | New branch feature widens PIN exposure | M | H | **no PIN UI/field; new branches PIN-less; `BranchView` omits PIN; interim uses existing PIN fallback** (C3) |
| R8 | Worker SA credential leakage | L | H | dedicated SA (`datastore.user`), wrangler-secret, rotation; honest about project-wide blast radius |
| R9 | Concurrent branch edits lose updates | M | M | all branch mutations in `runTransaction` (C8) |
| R10 | Timezone silently wrong for a multi-zone country | M | M | `resolveTimeZone` review flag + Settings confirm + per-branch TZ (C2) |
| R11 | Trial copy implies enforcement that doesn't exist | M | M | neutral signup (no duration); soft informational dashboard notice; documented limitation (C10) |
| R12 | Analytics loads unbounded events | L | M | `getCountFromServer` aggregation; no raw loads (C6) |
| R13 | A batch imports a later batch's type | M | H | dependency table §10.1; per-batch `tsc -b` gate (C1) |
| R14 | An early batch edits rules / breaks the final-rules phase | L | M | Batches 1–5 forbidden from editing `firestore.rules`; Batch 6 consolidates (C12) |

---

## 15. Final acceptance criteria
1. **Neutral entry:** no currency/plan/duration on `/signup` or `/login`; Google+email+verify+reset work; public pricing unchanged.
2. **Onboarding:** five stages (Account→Type→Details→Rewards→Review); **8** compact category cards (+ optional subtypes) → the 7 engines (no renames); no Modules step; no timezone/price UI; country drives currency (explicit for unlisted, no silent USD); optional "Other" services; idempotent business **and** initial-service creation; interrupted flow resumes.
3. **Rewards:** structured type/value/description/expiry; "Never expires" default; per-voucher `expiresAt` snapshot; program edits never rewrite vouchers or reset stamps; expired vouchers rejected; legacy defaults safe; dashboard editor consistent; fixed amounts stored as minor units.
4. **Reviews & Social:** settings tab with three independent toggled channels (disable keeps URL); only valid `https` channel links appear publicly; saved atomically via one method; public card shows enabled links with secure new-tab attributes and honest labels.
5. **Click analytics:** via the trusted Worker (not anonymous writes); **no customer identifier stored**; `locationId` verified or dropped; dashboard totals via aggregation counts (no raw loads); business- and branch-scoped; date-filtered; never labelled reviews/follows.
6. **Branches:** add/edit/archive/reactivate (soft, transactional, non-destructive); phone/hours/optional-TZ per branch; **no PIN exposure** (new branches PIN-less; interim uses existing PIN fallback; branch-specific PIN deferred to the security phase); branch-filtered analytics; context switching; CRM/loyalty shared business-wide and never hidden by a branch filter.
7. **Trial:** truthful — starts at creation, 30-day recorded, **unenforced**, full access retained, no auto-charge; neutral signup; documented limitation.
8. **Rules:** changed **only** in Batch 6 (consolidated, explained, emulator-validated, manual-paste, no auto-deploy); no existing rule weakened; no PINs/private data in any public projection or endpoint; clients can't write `socialClicks` or self-extend the trial.
9. **Quality:** each batch passes `npx tsc -b` independently; final `npm run lint` + `npx vite build` green; zero regressions across all seven verticals on mobile and both themes.

---

## 16. ARCHITECTURE_REVIEW_CHANGELOG (Rev. 1 → Rev. 2)
| # | Correction | What changed & why |
|---|---|---|
| C1 | Batch deps & TS order | `OnboardingData` fields are now introduced per-batch (§4.1): Batch 1 adds only `pendingBusinessId/reservedSlug`; Batch 2 adds country/category/logo/services; **Batch 3 defines `RewardType` and adds reward fields**. `authService` (Batch 1) no longer sets `rewardType/expiryDays`. Added the **§10.1 dependency table** and a rule that no batch imports a later batch's type. Reason: Rev. 1 referenced `RewardType` and reward fields before they existed, breaking per-batch compilation. |
| C2 | Country/currency/timezone | `countriesData` now lists **real countries** (Eurozone = member states, each EUR), carries `recommendedCurrency`/`altCurrencies`/`timeZones`/`minorUnitDigits`; unlisted = `ZZ` with **forced explicit currency (no silent USD)**. `resolveTimeZone` uses the browser tz **only when it belongs to the selected country**, else the country default, and sets a **`timeZoneConfirmed` review flag** surfaced in Settings; per-branch `timeZone?` retained. Reason: Rev. 1's `EU` pseudo-country and silent-USD/one-tz-per-country were inaccurate. |
| C3 | PIN exposure | `BranchEditModal` has **no PIN field**; new branches are **PIN-less**; `BranchView`/`listBranches` **never return `staffPin`**; `BusinessLocation.staffPin` is now optional; interim staff auth uses the existing any-location PIN fallback; **branch-specific PINs deferred** to a secure PIN phase. Reason: Rev. 1 contradicted its own security stance by writing/editing plaintext PINs in the new UI. |
| C4 | Social service contract | Removed the `socialLinksService` writer; the save path is **`businessService.updateSocialLinks`**, which loads the full `Business`, merges, and writes `businesses/{id}` + `publicProfiles/{id}` in **one `writeBatch`** (atomic). `toPublicProfile` still takes a full `Business`. Reason: Rev. 1 passed a partial `BusinessSocialLinks` to `toPublicProfile` (which needs a full `Business`) and risked split-write inconsistency. |
| C5 | Worker contract | Added full **CORS/OPTIONS**, explicit **`DESTINATION_TO_LINK`** mapping (googleReview↔google_review), **removed `memberId`** (data minimization), **server-side `locationId` verification** against active `publicProfiles.locations` (else unattributed), **wrangler-secret** bindings (`FIREBASE_SA_CLIENT_EMAIL`/`FIREBASE_SA_PRIVATE_KEY`/`TURNSTILE_SECRET`, no values in repo), **honest SA scope** (`datastore.user`, project-wide write, no path-level IAM) + rotation, concrete **Cloudflare rate-limiting** + **verified** Turnstile policy, and an explicit at-least-once retry/duplicate model. |
| C6 | Analytics scalability | Dashboard totals now use **`getCountFromServer` aggregation** (per destination/range/branch) with two composite indexes — **no raw-event browser loads**. Documented read cost, retention (optional TTL), isolation, and rejected alternatives. |
| C7 | Initial-service idempotency | Each `InitialServiceDraft` gets a **stable `id`** generated once in the wizard; `genericService.upsertService` writes with that id so resume finishes only the missing services without duplicates. |
| C8 | Branch integrity | All branch mutations run in **`runTransaction`** (read-modify-write the embedded array) — no lost updates / stale-array overwrite; archived preserved; last-active-archive refused; CRM/loyalty stay business-wide. |
| C9 | Money precision | Added per-currency **`minorUnitDigits`**, `toMinor/toMajor` boundary conversion, integer-minor-unit storage for fixed rewards and services; INR no-decimal is display-only; USD/INR back-compatible. No invented zero-decimal rule. |
| C10 | Trial truthfulness | Documented start (`createdAt`), 30-day recorded duration, `trialStatus` derivation, **no enforcement / full access retained / no auto-charge**, soft informational dashboard notice, neutral signup (no duration), and the explicit out-of-scope limitation. |
| C11 | Category simplification | Compacted to **8 top-level cards** (+ optional Salon/Other subtypes) using **existing icons only** (no sparkles); all categories remain reachable; `category` retained for analytics. |
| C12 | Rules phase | **Batches 1–5 do not edit/deploy `firestore.rules`**; they document required changes and introduce no violating client access. **Batch 6** consolidates the final rules + indexes, explains each, **emulator-validates**, and outputs a **copy-ready file (no auto-deploy)**. |
| C13 | Prompt alignment | All six prompts rewritten to match the above (inventory, contracts, deps, no-forward-refs, do-not-touch, tests, build/lint/typecheck, factual report). |

---

## FINAL REPORT
- **All identified contradictions resolved?** Yes — C1–C13 are each addressed in §3–§10 and reflected in the prompts; the specific Rev. 1 defects (forward `RewardType` refs; `toPublicProfile(partial)`; PIN in branch UI; `EU`/silent-USD; unbounded analytics; non-transactional branches; non-idempotent services; worker gaps; inline rule edits) are removed.
- **Can each of the six batches compile independently?** Yes, by construction — fields/types are introduced in the batch that first uses them (§4.1, §10.1), no batch imports a later batch's type, and every batch ends with a `npx tsc -b` gate.
- **Do all service signatures agree with their implementations?** Yes — §8 is authoritative; notably `updateSocialLinks` (not a partial into `toPublicProfile`), transactional branch methods returning `BranchView` (no PIN), `genericService.upsertService`, and `socialAnalyticsService.getClickSummary` (aggregation).
- **Are business, branch and public-profile data contracts consistent?** Yes — §4.4/§5.1 define private fields, the `BranchView` exposure (PIN-free), and the minimized public projection (no timeZone/selectedModules/PIN; enabled-only social links; archived branches excluded).
- **Design decisions still needing product-owner input:**
  1. **Trial enforcement/billing** — currently unenforced by design; confirm this stays out of scope (and the exact soft dashboard copy).
  2. **Supported country/currency list** — confirm the §4.3 set is sufficient (add specific countries if needed); confirm the "unlisted → explicit currency pick" behaviour.
  3. **Turnstile** — confirm whether to enable it (and its challenge strictness) or run on rate-limiting + origin allowlist alone.
  4. **socialClicks retention** — confirm whether to set a TTL (e.g., 400 days).
  5. **Branch-specific PINs** — confirm these are deferred to the dedicated secure-PIN phase (interim uses the shared-PIN fallback).
- **Exact remaining limitations:**
  1. The pre-existing **plaintext staff-PIN** model and **client-side critical mutations** are **not fixed** here (documented security-phase items); this pass only avoids widening them.
  2. **No trial enforcement/billing**; "free trial" is truthful but unenforced.
  3. Social click counts are **at-least-once / best-effort** (bounded by debounce + rate-limit); not exact, never a conversion metric.
  4. Final **Firestore rules + indexes are produced but not deployed** in Batch 6 (manual paste), per the security-phase requirement.
  5. The country/currency list is a **supported subset**; genuinely unlisted locales rely on an explicit currency choice and a timezone-review step.
```
