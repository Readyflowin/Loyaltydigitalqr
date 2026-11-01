# Social Links, Engagement Analytics & Branch Management Audit

**Audit Date:** November 1, 2026  
**Audited System:** Loyaltydigitalqr  
**Repository Branch:** `main`  
**Audit Scope:** Social destinations (Google Reviews, Instagram, TikTok), public customer pass presentation, click tracking architecture, multi-branch data scoping, and location management.

---

## 1. Reviews and Social Links Configuration Audit

### 1.1 Current State Analysis
A thorough codebase search confirms that **no social media or review management exists in the current system**:
- `src/types/business.ts`: `Business` interface has no fields for Google reviews, Instagram, or TikTok links.
- `src/components/dashboard/SettingsView.tsx`: Settings tabs are strictly limited to `['profile', 'locations', 'loyalty', 'team', 'billing']`. There is no "Reviews & Social" tab or section.
- `src/services/businessService.ts`: `toPublicProfile()` (lines 59-79) copies only basic branding, locations, and loyalty program details to `publicProfiles/{bizId}`.
- `src/pages/PublicLoyaltyCardPage.tsx`: The public loyalty card renders only the loyalty card canvas, reward vouchers, and stamp request button. No social icons or external review links exist.

### 1.2 Target Experience Requirements
The proposed system requires a dedicated dashboard section, such as **Reviews & Social**:
1. **Google Review Link:**
   - Destination URL (e.g., `https://g.page/r/.../review` or Google Business profile review URL).
   - Independent enable/disable toggle.
   - Edit and preview capability.
2. **Instagram Profile Link:**
   - Destination URL (e.g., `https://instagram.com/businessname`).
   - Independent enable/disable toggle.
3. **TikTok Profile Link:**
   - Destination URL (e.g., `https://tiktok.com/@businessname`).
   - Independent enable/disable toggle.
4. **Independent Toggle Semantics:**
   - Each destination must toggle on/off independently without erasing the saved destination URL.
   - Example state: Google Reviews: Enabled; Instagram: Disabled; TikTok: Enabled.
   - The customer-facing card must only render links that are both **enabled** and contain a **valid URL**.

---

## 2. Customer-Facing Loyalty Card Presentation

### 2.1 Route, Identification & Security Gate
- **Public Route:** Rendered at `/card/:slug` (enrollment form) and `/card/:slug/:memberId` (active stamp card) via `src/pages/PublicLoyaltyCardPage.tsx`.
- **Public Gate Wrapper:** Wrapped inside `<PublicBusinessGate slugOrId={...}>` in `src/App.tsx#L250-L258`.
- **Business Identification:** Resolved from the unique public slug via `businessService.findBusinessBySlug(slug)`, which queries the Firestore document `slugs/{slug}` to retrieve the underlying `businessId`.
- **Data Isolation & Privacy:**
  - Visitors load only `publicProfiles/{bizId}` (read-only, manager-written).
  - PINs, internal staff notes, member phone numbers, and emails are strictly omitted from `publicProfiles/{bizId}` and `memberCards/{memberId}` (`src/services/loyaltyService.ts#L52-L72`).
  - Firestore security rules (`firestore.rules#L109-L117` and `L296-L305`) restrict unauthenticated visitor access to these safe projections.

### 2.2 Layout & Mobile Touch Target Readiness
- `PublicLoyaltyCardPage.tsx` uses a centered, mobile-first column (`max-w-md mx-auto`).
- There is dedicated vertical space between the reward voucher block (lines 425-437) and the counter stamp request button (lines 476-490) or directly in a footer card.
- **Touch Target Specifications:**
  - Social buttons must maintain minimum touch targets of 44×44px (or full-width pill buttons with minimum 48px height) to comply with mobile accessibility guidelines.
  - Links must include `target="_blank"` and `rel="noopener noreferrer"` to prevent window opener hijacking and protect customer privacy.

---

## 3. Social Click & Tap Tracking Architecture

### 3.1 Honest Analytics Principle
The application can record when a user taps or clicks an external destination link. However, third-party platforms (Google Maps/Reviews, Instagram, TikTok) do not provide client-side callbacks indicating whether the customer actually published a review or followed the profile.

> [!IMPORTANT]
> The dashboard UI must clearly report **"Link Clicks"** or **"Profile Taps"**. It must **never** claim that clicks represent "Submitted Reviews" or "New Followers". False conversion claims undermine merchant trust.

### 3.2 Click Tracking Data Requirements
To record clicks accurately, an event record must capture:
- `id`: Unguessable unique identifier (32-character string).
- `businessId`: Scoped business workspace ID.
- `destination`: `'google_review' | 'instagram' | 'tiktok'`.
- `timestamp`: ISO timestamp string (`new Date().toISOString()`).
- `locationId`: Optional active branch identifier where the card was opened.
- `memberId`: Optional customer member ID (if customer is viewing `/card/:slug/:memberId`).

### 3.3 Storage Options & Security Risk Assessment

#### Option A: Dedicated Subcollection (`businesses/{bizId}/socialClicks/{clickId}`) — RECOMMENDED
- **Path:** `businesses/{bizId}/socialClicks/{clickId}`
- **Security Rule:**
  ```javascript
  match /socialClicks/{clickId} {
    allow read: if isMember(bizId);
    allow create: if clickId.matches('^[a-z0-9]{32}$')
      && request.resource.data.id == clickId
      && request.resource.data.businessId == bizId
      && request.resource.data.destination in ['google_review', 'instagram', 'tiktok']
      && request.resource.data.keys().hasOnly(['id', 'businessId', 'destination', 'timestamp', 'locationId', 'memberId']);
    allow update, delete: if isManager(bizId);
  }
  ```
- **Advantages:**
  - Preserves exact timestamps, allowing date-range filtering (`7d`, `30d`, `90d`, `all`) in `AnalyticsView`.
  - Scoped strictly to the business; other businesses cannot read or spam events.
  - Client-side debouncing in `localStorage` prevents double-counting if a user rapidly taps an icon.
- **Storage Management:** Capped via query limit (e.g. `limit(2000)`) in `bizStore` or aggregated periodically.

#### Option B: Direct Counter Increments on `publicProfiles` — NOT RECOMMENDED
- **Drawback:** Firestore client-side security rules cannot reliably restrict `FieldValue.increment(1)` without granting general update permission or exposing counters to arbitrary write manipulation.
- **Drawback:** Counters lose temporal granularity (cannot filter by last 7 days vs last 30 days).

---

## 4. Multi-Branch & Location Architecture

### 4.1 Core Distinction: Business vs. Branch
A critical architectural boundary exists between a **business** and a **branch**:

```
One Business Account (Subscription, Billing, Brand, Overall Loyalty Program)
  │
  ├── Branch 1: Main Location (Downtown Flagship, Staff PIN 4821, Specific Address)
  ├── Branch 2: Northside Express (Staff PIN 9312, Specific Address)
  └── Branch 3: Airport Kiosk (Staff PIN 1045, Specific Address)
```

A branch is **not** an independent legal business with a separate subscription. It is an operating venue under the master business workspace.

---

### 4.2 Current Location Implementation Audit
- **Data Model:** Defined in `src/types/business.ts#L4-L10`:
  ```ts
  export interface BusinessLocation {
    id: string;
    name: string;
    address: string;
    isPrimary: boolean;
    staffPin: string;
  }
  ```
- **Storage Location:** Embedded directly as an array on the `Business` document: `businesses/{bizId}.locations: BusinessLocation[]`.
- **Public Mirroring:** Mirrored in `publicProfiles/{bizId}.locations` with `staffPin` stripped (`src/services/businessService.ts#L73`).
- **Active Branch Selection:**
  - Persisted in browser `localStorage` under `loyalty_active_locations_map` as a JSON map `{ [bizId]: locationId }`.
  - When switching locations, `businessService.setActiveLocation(businessId, locationId)` updates the map and notifies subscribers.
- **Location Switcher UI:** `src/components/dashboard/BusinessSwitcherModal.tsx` lists businesses and their respective sub-locations, allowing seamless switching.
- **Staff Validation:** `businessService.verifyStaffPin(businessId, pin, locationId)` verifies the 4-6 digit numeric PIN against the active branch or any configured branch.

---

### 4.3 Data Scoping: Business-Wide vs. Branch-Specific

| Data Entity | Scope Level | Firestore Path | Cross-Branch Behaviour | Audit Finding |
| :--- | :--- | :--- | :--- | :--- |
| **Business Identity** | Business-Wide | `businesses/{bizId}` | Shared across all branches (Name, Logo, Brand Color, Currency). | Correctly centralized. |
| **Loyalty Program Config** | Business-Wide | `businesses/{bizId}/config/loyaltyProgram` | Unified rules (stamps required, reward description). | Correctly centralized. |
| **Customer Progress** | Business-Wide | `businesses/{bizId}/customers` | Customers collect stamps across any branch. Balance is shared. | Correctly centralized. |
| **Member Cards** | Business-Wide | `businesses/{bizId}/memberCards` | Unified public card representation. | Correctly centralized. |
| **Staff Validation PIN** | Branch-Specific | `businesses/{bizId}.locations[].staffPin` | Each branch maintains its own private PIN. | Working as intended. |
| **Operating Address** | Branch-Specific | `businesses/{bizId}.locations[].address` | Specific physical street address. | Working as intended. |
| **Audit Events** | Branch-Specific | `businesses/{bizId}/loyaltyEvents` | Events record `locationId?: string`. | Stored, but currently not filtered in Analytics. |
| **Table Management** | Branch-Specific | `businesses/{bizId}/tables` | Café/restaurant tables and dining areas. | Partially implemented; currently lacks strict location scoping. |
| **Appointments & Staff** | Branch-Specific | `businesses/{bizId}/appointments` | Salon appointments record `locationId`. | Stored with locationId. |
| **Social Links** | Business-Wide | `businesses/{bizId}.socialLinks` | Social channels apply across the brand. | Can optionally support location-specific Google Review links. |

---

### 4.4 Missing Functionality & Location Gaps

1. **Branch Status Field Missing:** `BusinessLocation` lacks an `isActive` or `status: 'active' | 'archived'` flag. In `SettingsView.tsx`, removing a location deletes it from the array, which risks breaking historical audit records referencing that `locationId`.
2. **Branch Operating Hours & Contact:** No per-branch phone number or opening hours exist; currently, phone number is stored only at the master business level.
3. **Branch-Filtered Analytics:** Although `loyaltyEvents`, `orders`, and `appointments` record `locationId`, `src/components/dashboard/growth/AnalyticsView.tsx` aggregates all metrics business-wide without a location dropdown filter.
4. **Branch-Specific QR Codes:** `QrCodeDefinition` has an optional `locationId?: string`, but public card URLs (`/card/:slug`) do not currently encode the branch ID, preventing automatic branch attribution on self-enrollment.

---

## 5. Architectural Recommendations

### 5.1 Social Links Implementation Plan
1. **Schema Extension in `Business`:**
   ```ts
   export interface SocialLinkConfig {
     url: string;
     enabled: boolean;
   }

   export interface BusinessSocialLinks {
     googleReview?: SocialLinkConfig;
     instagram?: SocialLinkConfig;
     tiktok?: SocialLinkConfig;
   }
   ```
2. **Settings Section:** Add a dedicated **Reviews & Social** tab in `SettingsView.tsx` with URL validation (regex ensuring valid HTTPS links) and independent toggle switches.
3. **Public Projection:** Include only enabled social links in `publicProfiles/{bizId}` so that disabled links are never sent to visitor browsers.
4. **Customer Card Integration:** Render a modern, accessible pill-button row on `PublicLoyaltyCardPage.tsx` with SVG icons for Google, Instagram, and TikTok.
5. **Click Event Subcollection:** Record clicks to `businesses/{bizId}/socialClicks` with client-side session throttling to prevent spam.

### 5.2 Branch Management Refinements
1. **Extend `BusinessLocation`:**
   ```ts
   export interface BusinessLocation {
     id: string;
     name: string;
     address: string;
     phoneNumber?: string;
     isPrimary: boolean;
     staffPin: string;
     status: 'active' | 'archived';
     createdAt: string;
   }
   ```
2. **Soft Deactivation:** Replace destructive location removal with archiving (`status = 'archived'`), preserving historical transaction references.
3. **Branch Analytics Filter:** Add a location picker to `AnalyticsView.tsx` allowing owners to filter visit volume, stamp issuance, and social clicks by branch or view all branches combined.
4. **Loyalty Continuity:** Maintain business-wide customer loyalty as the default so customers can seamlessly earn and redeem rewards at any location owned by the business.
