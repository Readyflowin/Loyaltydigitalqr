# Firebase Schema, Data Model & Security Rules Impact Analysis

**Audit Date:** November 1, 2026  
**Audited System:** Loyaltydigitalqr  
**Repository Branch:** `main`  
**Audit Scope:** Firestore database structure, collection hierarchies, document schemas, security rules, indexes, and migration compatibility.

---

## 1. Current Firestore Architecture & Service Mapping

Loyaltydigitalqr uses a multi-tenant, business-scoped Firestore architecture managed by `bizStore.ts` (`src/lib/bizStore.ts`).

### 1.1 Root Collections Overview

| Collection Path | Purpose | Access Control (firestore.rules) |
| :--- | :--- | :--- |
| `/users/{uid}` | Merchant user account profile. | Authenticated owner only (`request.auth.uid == uid`). |
| `/slugs/{slug}` | Unique public URL reservation pointing to `businessId`. | Public get (`allow get: if true`); members create (`isMember`). |
| `/publicProfiles/{bizId}` | Public branding, locations, and public config. | Public get (`allow get: if true`); manager write (`isManager`). |
| `/businesses/{bizId}` | Private workspace root containing member UIDs and metadata. | Workspace members only (`request.auth.uid in resource.data.memberUids`). |

---

### 1.2 Subcollections Under `businesses/{bizId}`

| Subcollection Path | Managed Service | Public Read | Security Constraints |
| :--- | :--- | :--- | :--- |
| `/config/{docId}` | `businessService.ts`, `loyaltyService.ts` | Yes for `loyaltyProgram` | Single doc for loyalty program configuration; manager write. |
| `/invites/{email}` | `businessService.ts` | No | Team invitations; invitee can view their own invite. |
| `/customers/{id}` | `loyaltyService.ts` | No | Full customer CRM; members only (unauthenticated create on self-enrollment). |
| `/customerPhones/{phoneKey}` | `loyaltyService.ts` | No | Uniqueness index for mobile numbers. |
| `/customerEmails/{emailKey}` | `loyaltyService.ts` | No | Uniqueness index for email addresses. |
| `/memberCards/{id}` | `loyaltyService.ts` | Yes (individual) | Sanitized customer card projection; unguessable ID. |
| `/stampRequests/{reqId}` | `stampRequestService.ts` | Yes (individual) | Stamp approval queue from counter QR scans. |
| `/loyaltyEvents/{id}` | `loyaltyService.ts` | No | Append-only audit log of stamps, rewards, and program updates. |
| `/qrCodes/{id}` | `loyaltyService.ts` | No | Saved counter QR codes and digital pass links. |
| `/serviceItems/{id}` | `genericService.ts` | Yes | Custom service catalogue items for "Other" businesses. |
| `/serviceJobs/{id}` | `genericService.ts` | No | Service activity records. |
| `/tables/{id}` | `cafeService.ts` | Yes | Table identifiers and QR standees. |
| `/menus/{id}` | `cafeService.ts` | Yes | Digital restaurant/café menus. |
| `/appointments/{id}` | `salonService.ts` | Yes (individual) | Salon bookings. |
| `/offers/{id}` | `growthService.ts` | No | Promotional offers and campaigns. |

---

## 2. Proposed Schema Extensions & Field Changes

### 2.1 Reviews & Social Links Schema

#### A. Document: `businesses/{bizId}` (Private)
Add `socialLinks` object:
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

#### B. Document: `publicProfiles/{bizId}` (Public Projection)
Add projected `socialLinks`. To preserve privacy and bandwidth, **only enabled links with non-empty URLs** are copied:
```ts
socialLinks: {
  googleReview: biz.socialLinks?.googleReview?.enabled && biz.socialLinks.googleReview.url
    ? biz.socialLinks.googleReview.url
    : null,
  instagram: biz.socialLinks?.instagram?.enabled && biz.socialLinks.instagram.url
    ? biz.socialLinks.instagram.url
    : null,
  tiktok: biz.socialLinks?.tiktok?.enabled && biz.socialLinks.tiktok.url
    ? biz.socialLinks.tiktok.url
    : null,
}
```

---

### 2.2 Social Click Event Subcollection (New)

#### Path: `businesses/{bizId}/socialClicks/{clickId}`
A high-throughput, append-only subcollection for tracking customer engagement:

```ts
export interface SocialClickEvent {
  id: string; // 32-character unguessable alphanumeric ID
  businessId: string;
  destination: 'google_review' | 'instagram' | 'tiktok';
  timestamp: string; // ISO 8601 UTC timestamp
  locationId?: string; // Optional branch attribution
  memberId?: string; // Optional customer member ID
}
```

#### Security Rule Extension:
```javascript
match /socialClicks/{clickId} {
  allow read: if isMember(bizId);
  allow create: if clickId.matches('^[a-z0-9]{32}$')
    && request.resource.data.id == clickId
    && request.resource.data.businessId == bizId
    && request.resource.data.destination in ['google_review', 'instagram', 'tiktok']
    && request.resource.data.timestamp is string
    && request.resource.data.keys().hasOnly(['id', 'businessId', 'destination', 'timestamp', 'locationId', 'memberId']);
  allow update, delete: if isManager(bizId);
}
```

---

### 2.3 Loyalty Program Configuration & Expiry Schema

#### Document: `businesses/{bizId}/config/loyaltyProgram`
Extend `LoyaltyProgramConfig` (`src/types/loyalty.ts`):
```ts
export type RewardType = 'free_item' | 'percentage_discount' | 'fixed_amount' | 'custom';

export interface LoyaltyProgramConfig {
  // Existing fields
  id: string;
  businessId: string;
  name: string;
  type: LoyaltyProgramType;
  stampsRequired: number;
  rewardDescription: string;
  terms?: string;
  accentColor: string;
  status: LoyaltyProgramStatus;
  enrollment?: EnrollmentConfig;
  createdAt: string;
  updatedAt: string;

  // New structured fields
  rewardType: RewardType;
  rewardValue?: number; // e.g. 15 for 15% discount; 500 for $5.00 / ₹50.00 in minor units
  expiryDays?: number | null; // null or 0 = "Never expires"; e.g. 30, 60, 90, 180, 365
}
```

#### Schema Extension for Unlocked Customer Rewards (`CustomerReward`):
Stored in `businesses/{bizId}/customers/{customerId}.rewards[]` and projected to `memberCards/{memberId}.rewards[]`:
```ts
export interface CustomerReward {
  id: string;
  rewardDescription: string;
  voucherCode: string;
  unlockedAt: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  redeemedByStaff?: string;
  
  // New expiry & metadata fields
  rewardType?: RewardType;
  expiresAt?: string | null; // ISO 8601 timestamp (null = never expires)
  amountSavedMinor?: number;
}
```

---

### 2.4 Branch / Location Schema Enhancements

#### Document: `businesses/{bizId}.locations[]`
Extend `BusinessLocation` in `src/types/business.ts`:
```ts
export interface BusinessLocation {
  id: string; // loc_xxxxxxxx
  name: string;
  address: string;
  phoneNumber?: string;
  isPrimary: boolean;
  staffPin: string; // 4 to 6 digits
  status?: 'active' | 'archived'; // Defaults to 'active'
  createdAt?: string;
}
```

---

## 3. Security Rules & Public Access Implications

### 3.1 Public Visitors vs. Private Data Boundary
1. **Public Profiles (`/publicProfiles/{bizId}`):**
   - Publicly readable (`allow get: if true;`).
   - Contains: `name`, `businessType`, `region`, `currency`, `accentColor`, `logoUrl`, public locations (without PINs), and enabled social links.
   - Staff PINs, member emails, owner UID, and private business settings are strictly omitted.
2. **Loyalty Member Cards (`businesses/{bizId}/memberCards/{id}`):**
   - Individual document read only (`allow get: if true;`). Listing is blocked (`allow list: if false;`).
   - Contains: `firstName`, `currentStamps`, `lifetimeStamps`, and unredeemed `rewards` with `voucherCode` and `expiresAt`.
   - Contact numbers, emails, and staff notes are never written to `memberCards`.
3. **Public Click Tracking Security:**
   - Public visitors must be able to log a click event without signing in.
   - The proposed `/socialClicks/{clickId}` rule strictly validates document structure, field count, ID length, and destination enums, preventing attackers from injecting arbitrary fields or modifying existing records.

---

## 4. Backend & Cloud Functions Evaluation

### 4.1 Are Cloud Functions Required?
The audit carefully evaluated whether the proposed features necessitate Cloud Functions:
1. **Social Link Clicks:** Can be written directly to Firestore from the client using the validated security rule described above. A Cloud Function is **not** required.
2. **Reward Expiration:** Expiration is evaluated deterministically at query/render time:
   ```ts
   const isExpired = reward.expiresAt ? new Date(reward.expiresAt).getTime() < Date.now() : false;
   ```
   Redemption validation also checks `isExpired`. No scheduled cron worker or Cloud Function is required to delete expired rewards.
3. **Multi-Branch Operations:** Managed via Firestore batch writes and atomic transactions in `businessService.ts`.
4. **Image Uploads:** Handled via the existing Cloudflare Worker (`worker/src/index.ts`).

**Conclusion:** All proposed requirements can be implemented securely using client-side Firestore SDKs and Security Rules without deploying Firebase Cloud Functions.

---

## 5. Indexes & Query Performance

### 5.1 Existing Indexes (`firestore.indexes.json`)
The current repository contains only one collection-group override:
```json
{
  "indexes": [],
  "fieldOverrides": [
    {
      "collectionGroup": "invites",
      "fieldPath": "email",
      "indexes": [
        { "order": "ASCENDING", "queryScope": "COLLECTION" },
        { "order": "ASCENDING", "queryScope": "COLLECTION_GROUP" }
      ]
    }
  ]
}
```

### 5.2 Required Index Additions
If social click events are queried with composite filters (e.g., filtered by `destination` and ordered by `timestamp`), a composite index will be needed:
```json
{
  "collectionGroup": "socialClicks",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "destination", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```
If queries simply load the latest clicks per business ordered by `timestamp`, the default single-field index on `timestamp` is sufficient.

---

## 6. Backwards Compatibility & Migration Strategy

### 6.1 Safe Schema Evolution
All proposed schema changes are non-destructive and backward-compatible:
1. **Existing Businesses:**
   - Existing businesses lack `socialLinks`. Code will treat `undefined` as empty links (no icons displayed).
   - Existing businesses lack `rewardType`. Code will fallback to `'custom'`.
   - Existing loyalty rewards lack `expiresAt`. Code will treat `undefined` as "Never expires".
   - Existing locations lack `status`. Code will treat `undefined` as `'active'`.
2. **Zero Downtime Migration:**
   - No migration script is required before deployment.
   - Default fallbacks ensure 100% runtime stability for existing accounts.
