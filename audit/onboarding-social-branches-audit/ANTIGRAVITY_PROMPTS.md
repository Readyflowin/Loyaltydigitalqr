# Antigravity Implementation Prompts (6 Batches) — Rev. 2

Copy-ready prompts for **Gemini Antigravity**, in lock-step with `IMPLEMENTATION_BLUEPRINT.md` (Rev. 2, same folder). **Execute strictly in order 1→6.** Shared contracts: blueprint **§4** (data models) and **§8** (service signatures). Batch dependency table: **§10.1**.

**Global rules (every batch):**
- Do **not** rename the seven `BusinessType` engines (`cafe,restaurant,salon,retail,gym,carwash,service`).
- **No batch may import a type/function/service/file introduced in a later batch** (see §10.1). `RewardType` does not exist until Batch 3.
- Reuse existing services/conventions (`bizStore`, `businessService`, `loyaltyService`, `genericService`, `uploads`, `authService`). **Do not create duplicate business/public-profile/social services.**
- Money is integer **minor units**; convert major↔minor once at the UI/service boundary (`toMinor/toMajor`); never store formatted strings; use the shared `formatMinorUnits`.
- All reward/URL/timezone/money validation comes from the shared util named in the blueprint — no inline re-implementation.
- **Do not edit or deploy `firestore.rules` or `firestore.indexes.json` in Batches 1–5.** Document required rule changes in your report; introduce no client access the current rules forbid (route such writes through the Worker). Rules + indexes are produced in **Batch 6 only** (no auto-deploy).
- **Do not expose staff PINs** anywhere new (no PIN UI, no PIN in responses, no new plaintext PIN). Do not claim the pre-existing PIN or client-mutation vulnerabilities are fixed.
- After coding: run `npx tsc -b`, `npm run lint`, `npx vite build` — all must pass (each batch must `tsc -b` cleanly on its own). Then write a **factual implementation report** (files created/modified, decisions, test results, documented rule changes, anything deferred). Do not claim work you didn't do.
- Preserve all existing auth, verification, routing, QR, loyalty, CRM, and industry workflows.

---

## BATCH 1 — Neutral signup & login

**Blueprint:** §3(D-trial,D1), §4.1(Batch-1 fields), §7.1, §10.1, §12 Account, §15.1.

**Create:** none. **Modify:** `src/pages/SignupPage.tsx`, `src/pages/LoginPage.tsx`, `src/services/authService.ts`, `src/types/onboarding.ts` (add **only** `pendingBusinessId?`, `reservedSlug?`).
**Do NOT touch:** pricing pages; Firebase auth/verify logic; router routes. **Do NOT** add `category/country/currency/reward*` fields (later batches). **Do NOT** reference `RewardType` or any country/reward type.

**Requirements:**
1. `SignupPage`: delete `pricingDetails`/region-price callout (`#L16-L52,#L121-L135`); hero = "Start your free trial" (**no `$`/`₹`, no plan name, no day count**). Keep Google + email/password. `?region` may be stored as a hidden draft hint only. On success seed the draft with a `pendingBusinessId` (`newId()`) and navigate to `/onboarding` (no required query).
2. `LoginPage`: remove "30-day"/pricing wording (use "Create an account"/"Start your free trial"). Keep Google/email/reset/redirect/already-signed-in.
3. `authService.getDefaultOnboardingData`: initialize `pendingBusinessId`; **do not** set `rewardType`/`expiryDays`/country/currency (types not defined yet).

**Edge cases:** `?region=india|usa|absent` render identically neutral; interrupted verification recovers.
**Tests:** [A] default draft has `pendingBusinessId` and **no** reward/country fields; [M] no `$`/`₹`/plan/duration on `/signup`,`/login`; all auth paths work; signup → onboarding.
**Acceptance:** §15.1. **Report required** (confirm `tsc -b` clean).

---

## BATCH 2 — Business type & business details

**Blueprint:** §3(D1,D-cat,D-tz,D4,D-money,D-idem), §4.1(Batch-2),4.2,4.3,4.6(InitialServiceDraft),4.7, §5.1, §7.1,7.2.A,7.2.B, §10.1, §12 Onboarding, §15.2.

**Create:** `src/data/onboardingCategories.ts`, `src/data/countriesData.ts`, `src/utils/money.ts`, `src/components/onboarding/BusinessTypeCards.tsx`, `src/components/onboarding/CountryCurrencyField.tsx`, `src/components/onboarding/OtherServicesSetup.tsx`.
**Modify:** `src/types/onboarding.ts` (Batch-2 fields + `OnboardingCategoryId` + `InitialServiceDraft`; relax `selectedModules?/contactEmail?/address?/phoneNumber?/displayName?/locationType?`), `src/types/business.ts` (widen `currency/currencySymbol` to `string`; add `countryCode/category/logoUrl/timeZoneSource/timeZoneConfirmed`), `src/pages/OnboardingPage.tsx` (Type + Details steps; **remove Modules step**), `src/services/businessService.ts` (idempotent `createBusiness`; `toPublicProfile`), `src/services/genericService.ts` (`upsertService`), `src/data/onboardingData.ts` (keep `BUSINESS_TYPES`; drop required module selection), `src/types/cafe.ts` (re-export `formatMinorUnits` from `utils/money`).
**Do NOT touch:** engine identifiers; dashboard industry views; `uploads.ts`. **Do NOT** reference `RewardType`/reward fields.

**Requirements:**
1. `onboardingCategories.ts`: exactly the **8 `PRIMARY_CATEGORIES`** + optional subtypes per §4.2, **existing icons only** (`Coffee,UtensilsCrossed,Scissors,ShoppingBag,Dumbbell,Car,Briefcase`); export `PRIMARY_CATEGORIES,categoryToEngine,categoryLabel`.
2. `countriesData.ts`: real countries + `CURRENCIES` (with `minorUnitDigits`) + `resolveTimeZone` per §4.3. Eurozone = member states (each EUR). **No `EU` pseudo-country. No silent USD** — `ZZ` ("not listed") forces an explicit currency pick.
3. `money.ts`: `formatMinorUnits(amountMinor,currencyOrSymbol)` using `minorUnitDigits` (INR drop-`.00`-when-whole display-only), `toMinor`,`toMajor`. `types/cafe.ts` re-exports `formatMinorUnits`.
4. `BusinessTypeCards`: 8 cards; selecting *Salon & Spa* / *Other* reveals optional subtype chips (same engine); emits `category` + derived `businessType`.
5. `CountryCurrencyField`: country select → `recommendedCurrency` pre-selected but changeable within supported currencies; `ZZ` requires an explicit currency choice; set `currency/currencySymbol/countryCode` + derived `timeZone/timeZoneSource/timeZoneConfirmed` via `resolveTimeZone`. **No timezone UI, no prices.**
6. `OtherServicesSetup`: optional; each row stores a **stable `id`** (generated once) + `priceMinor` (via `toMinor`); skippable.
7. `OnboardingPage`: Steps "Business type" + "Business details" (name, optional logo via `uploads` with initials fallback, `CountryCurrencyField`, optional `OtherServicesSetup` when engine `service`). **Remove the Modules step.** Persist each step to the draft.
8. `businessService.createBusiness` idempotent per §7.2.A (reuse `pendingBusinessId`; resume if owned business exists; reuse `reservedSlug`; set country/currency/category/logo/timezone+source+confirmed/`trialStatus:'trialing'`; primary location keeps its generated PIN; initial services via `upsertService` with their stable ids). `toPublicProfile`: add `logoUrl`; non-archived locations `{id,name,address,isPrimary}`; **remove `timeZone` and `selectedModules`**. (Social links added Batch 4.)
9. `genericService.upsertService(businessId,{id,name,priceMinor,category?,description?})` → idempotent `setDoc` at `serviceItems/{id}`.

**Edge cases:** unlisted country → explicit currency (never silent USD); currency set once (no historical conversion); initial services skippable; logo failure → initials fallback (non-blocking); browser tz not in country → country default + `timeZoneConfirmed:false`.
**Tests:** [A] `categoryToEngine` all ids valid; `currencyMeta('IN'/INR)`; `resolveTimeZone` branches; `formatMinorUnits` USD/INR/GBP/EUR; `toMinor/toMajor`; idempotent `createBusiness` (same id on retry); `upsertService` dedupe. [M] 8 cards + subtypes; no tz/price; ZZ forces currency; "Other" services save; refresh resumes.
**Acceptance:** §15.2 + §15.7(projection). **Report required** (confirm `tsc -b` clean; **no `RewardType` referenced**).

---

## BATCH 3 — Rewards & final onboarding review

**Blueprint:** §3(D-reward,D-money,D-idem), §4.1(Batch-3),4.5,4.6, §5.1, §7.1, §10.1, §12 Rewards, §15.3.

**Create:** `src/utils/loyaltyRewards.ts`, `src/components/onboarding/RewardConfigStep.tsx`, `src/components/onboarding/FinalReviewCard.tsx`.
**Modify:** `src/types/loyalty.ts` (**define `RewardType`**; program `rewardType/rewardValue/expiryDays`; reward `rewardType/rewardValue/expiresAt`), `src/types/onboarding.ts` (add `rewardType?/rewardValue?/expiryDays?`, now `import type { RewardType }`), `src/services/loyaltyService.ts`, `src/components/onboarding/LoyaltyCardPreview.tsx`, `src/components/dashboard/SettingsView.tsx` (loyalty tab), `src/components/dashboard/loyalty/LoyaltyProgramEditModal.tsx`, `src/pages/OnboardingPage.tsx` (Rewards + Review steps).
**Do NOT touch:** stamp rollover math; the snapshot-at-unlock behavior (extend it, don't replace); existing issued vouchers; firestore.rules.

**Requirements:**
1. `types/loyalty.ts`: `RewardType` union + program/reward fields per §4.5. This is the **first** definition of `RewardType`.
2. `loyaltyRewards.ts`: `validateRewardConfig` (percent 1–100; fixed `≥0` minor units; free/custom need description `≥2` chars; stamps 3–24; `expiryDays` null/0 or positive `≤1095`), `computeExpiresAt`, `isRewardExpired`, `rewardDisplay(type,value,desc,currencySymbol)`.
3. `loyaltyService`: default program includes reward fields; `saveProgram` persists them (validated); **`issueStamp`** sets `rewardType/rewardValue/expiresAt` on the new `CustomerReward` **and** its `memberCards` mirror (`expiresAt = computeExpiresAt(unlockedAt, program.expiryDays)`); **`redeemReward`** rejects expired (`'This reward has expired.'`). Program edits must not alter existing `rewards`/`currentStamps`.
4. `RewardConfigStep` + `FinalReviewCard` per §7.1: threshold (presets+custom int), reward-type selector, conditional value input (percent / money via `toMinor` / none), description, expiry ("Never expires" default + 30/60/90/180/365 + custom). Review shows all fields incl. `categoryLabel`, currency, optional services; edit-back; submit disabled while `isSubmitting`.
5. `SettingsView` loyalty tab + `LoyaltyProgramEditModal`: structured reward editing reusing the same fields/validation; warn changes apply to **future** rewards only.

**Edge cases:** legacy program→`custom`; legacy voucher→never; `expiryDays:null`→never; expired shown & non-redeemable; percent>100 rejected; fixed stored as minor units.
**Tests:** [A] expiry snapshot math (30→+30d; null→null); legacy never-expire; expired redemption rejected; program edit doesn't touch issued vouchers/stamps; each `validateRewardConfig` branch; `toMinor` for fixed amounts. [M] onboarding rewards + review; dashboard parity.
**Acceptance:** §15.3. **Report required** (`tsc -b` clean).

---

## BATCH 4 — Reviews/social settings & customer card

**Blueprint:** §3(D-social,D11), §4.4(social/trial),4.6(social types), §5.1, §5.2(**document only**), §6.1, §7.1,7.2.F, §12 Social(settings/card), §15.4.

**Create:** `src/types/social.ts`, `src/utils/socialUrls.ts`, `src/components/public/SocialLinksRow.tsx`.
**Modify:** `src/types/business.ts` (`SocialLinkConfig`,`BusinessSocialLinks`,`socialLinks?`, `TrialStatus`,`trialStatus?`), `src/services/businessService.ts` (**`updateSocialLinks`** + `projectSocialLinks` + `toPublicProfile` social projection + `getTrialState`), `src/components/dashboard/SettingsView.tsx` (new `'reviews-social'` tab), `src/pages/PublicLoyaltyCardPage.tsx` (render links + reward expiry display; leave an `onBeacon?` no-op hook — wired in Batch 5).
**Do NOT:** create a `socialLinksService` writer (use `businessService.updateSocialLinks`); edit `firestore.rules`; weaken the public-profile privacy boundary; include `memberId` anywhere.

**Requirements:**
1. `types/social.ts`: `SocialDestination`, `SocialClickEvent` (**no `memberId`**), `SocialClickSummary`, `DESTINATION_TO_LINK` per §4.6.
2. `socialUrls.validateSocialUrl(destination,url)`: require `https:` + per-channel host allowlist (google_review ∈ {g.page,google.com,maps.google.com,maps.app.goo.gl,search.google.com}; instagram ∈ {instagram.com,www.instagram.com}; tiktok ∈ {tiktok.com,www.tiktok.com,vm.tiktok.com}).
3. `businessService.updateSocialLinks(businessId,next)` per §7.2.A: load current full `Business`, validate enabled links, `merged={...current,socialLinks:next}`, **one `writeBatch`**: `update(businesses/{id},{socialLinks:next})` + `set(publicProfiles/{id},toPublicProfile(merged))`, commit. `projectSocialLinks` (enabled+valid only) used inside `toPublicProfile`. On validation failure → honest thrown error; no partial write.
4. `SettingsView` "Reviews & Social" tab: three channels (URL + independent toggle); disabling keeps URL; invalid URL blocks save with a message; saves via `updateSocialLinks`.
5. `PublicLoyaltyCardPage` + `SocialLinksRow`: render only links in `publicProfiles.socialLinks`; ≥44px pills, brand icons, labels "Leave a Google review"/"Follow on Instagram"/"Follow on TikTok"; `<a target="_blank" rel="noopener noreferrer">`; **no conversion claims**. Display unredeemed reward `expiresAt` truthfully (mark/hide expired). Expose an `onBeacon?(destination)` prop (no-op now).
6. **Document** (do not apply) the Batch-6 rule changes this batch depends on: socialClicks member-read/client-deny; add `trialStatus/trialEndsAt` to the client-immutable business-update set.

**Edge cases:** all disabled → no row; one enabled → one button; invalid saved URL never projected; businesses without `socialLinks` → nothing shown.
**Tests:** [A] `validateSocialUrl` per channel; `updateSocialLinks` writes both docs atomically, omits disabled/invalid, preserves other public-profile fields. [M] toggle independence; public card shows enabled+valid; secure new-tab; expiry shown.
**Acceptance:** §15.4 (+ §15.8 privacy). **Report required** (list the documented rule changes; `tsc -b` clean).

---

## BATCH 5 — Social click analytics & branch management

**Blueprint:** §3(D-worker,D-analytics,D-branch,D-pin,D-scope), §4.4(location/BranchView),4.6, §5.1, §5.2–5.3(**document only**), §6.2–6.5, §7.1,7.2.A(branch),7.2.C,7.2.D,7.2.E, §10.1, §12 Social(clicks)+Branches, §15.5–15.6.

**Create:** `src/services/socialAnalyticsService.ts`, `src/components/dashboard/settings/BranchEditModal.tsx`.
**Modify:** `worker/src/index.ts` (`OPTIONS`+`POST /social-click`), `src/components/dashboard/growth/AnalyticsView.tsx`, `src/services/growthService.ts` (optional `locationId`), `src/components/dashboard/SettingsView.tsx` (locations tab CRUD/archival + TZ-review banner), `src/components/dashboard/BusinessSwitcherModal.tsx` (hide archived), `src/types/business.ts` (`OperatingHours`, `BusinessLocation` fields, `staffPin?`, `BranchView`), `src/services/businessService.ts` (transactional branch methods + `listBranches` + PIN-relaxed `updateBusiness`), `src/pages/PublicLoyaltyCardPage.tsx`/`SocialLinksRow.tsx` (wire the Worker beacon + debounce).
**Do NOT:** change the business-wide scope of `customers`/`memberCards`/loyalty; touch the `/upload` route; add a **PIN field** to `BranchEditModal`; store `memberId`; edit `firestore.rules`/`firestore.indexes.json`.

**Requirements:**
1. **Worker `/social-click`** exactly per §6.2–6.5: `OPTIONS` + `POST`; CORS on all responses; body validation; **destination enabled** via `publicProfiles` using `DESTINATION_TO_LINK`; **`locationId` verified** against active `publicProfiles.locations` (unverified → write **unattributed**, no `locationId`); rate-limit → 429; optional Turnstile **verified** server-side; SA write to `socialClicks` via Firestore REST using `FIREBASE_SA_CLIENT_EMAIL`/`FIREBASE_SA_PRIVATE_KEY`; 32-hex id + server timestamp; **no `memberId`**. Keep `/upload` intact. In the report, list the `wrangler secret put` names and the SA role (`datastore.user`) + rotation note — **no secret values**.
2. `SocialLinksRow` beacon: on click, `fetch(WORKER/social-click,{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({businessId,destination,locationId?})}).catch(()=>{})` with a per-destination `localStorage` debounce (1/15 min); navigation proceeds regardless. **Never block navigation; never send `memberId`.**
3. `socialAnalyticsService.getClickSummary(businessId,range,locationId?)` via **`getCountFromServer`** per destination with the range `timestamp>=` filter (+ optional `locationId==`). **No raw-event loads.**
4. `AnalyticsView`: branch filter dropdown (All + active branches) scoping **operational** metrics only (business-wide CRM/loyalty untouched); "Social link taps" card (3 counts + total; copy = taps, not reviews/follows). `growthService.getGrowthAnalytics` gains optional `locationId` filtering events by `locationId` where present.
5. **Branch model + methods** (§4.4, §7.2.A): extend `BusinessLocation` (`status/phoneNumber/operatingHours?/timeZone?/createdAt`, `staffPin?` optional) + `BranchView` (no `staffPin`, `hasPin:boolean`). Implement `listBranches`, and **transactional** `addLocation`(PIN-less)/`updateLocation`(no `staffPin` in patch)/`archiveLocation`(refuse last active; move active context if needed)/`reactivateLocation`; each re-projects the public profile. Relax `updateBusiness` PIN validation to locations that have a PIN.
6. `BranchEditModal` (§7.2.E): name/address/phone/hours/status/optional-TZ — **no PIN field**; inline note that secure branch-PIN setup is coming. `BusinessSwitcherModal` hides archived.
7. **Document** (do not apply) Batch-6 rules (socialClicks member-read/client-deny) and the two composite indexes (§5.3).

**Edge cases:** destination disabled → endpoint 404 (no event); over-limit → 429 (client ignores); unverified/absent `locationId` → unattributed; archive last active refused; concurrent branch edits must not lose updates; branch filter never hides CRM totals; `listBranches`/modal never reveal a PIN.
**Tests:** [W] endpoint valid/disabled/bad-origin/over-limit/unverified-location; socialClicks not client-writable; no `memberId` stored. [A] `getClickSummary` query shapes; `getGrowthAnalytics` location filter; branch tx add/update/archive/reactivate; archive refuses last active; **concurrent-edit transaction** test; `listBranches` omits `staffPin`. [M] create/edit/archive/reactivate; switch context; branch vs business-wide analytics; shared loyalty across branches.
**Acceptance:** §15.5 + §15.6. **Report required** (Worker deploy/secret ops; documented rules/indexes; `tsc -b`+lint+build green).

---

## BATCH 6 — Firestore rules, regression & acceptance

**Blueprint:** §3(D-rulesphase,D11), §5.2–5.3, §6.1, §12 Regression, §15.

**Create:** none. **Modify:** **`firestore.rules`** (consolidated), **`firestore.indexes.json`** (consolidated), and **bug fixes only** found during regression.
**Do NOT:** create a second version of any Batch 1–5 file; add features; rename engines; **auto-deploy** rules.

**Requirements:**
1. **Consolidate all required rule changes** documented by Batches 4–5 into `firestore.rules`:
   - `match /businesses/{bizId}/socialClicks/{clickId} { allow read: if isMember(bizId); allow create,update,delete: if false; }`
   - Add `trialStatus` and `trialEndsAt` to the client-immutable field set on the `businesses/{bizId}` update rule (clients cannot self-extend the trial).
   - Confirm `publicProfiles`/`customers`/`memberCards`/`serviceItems`/branch fields need **no** rule change (projection is code-side; branches are business-doc fields).
   - **Weaken nothing.** Provide a short explanation comment for **every** changed/added rule.
2. `firestore.indexes.json`: add the two `socialClicks` composite indexes (§5.3); confirm the `invites.email` override is present.
3. **Validate** the final rules with the Firebase Emulator (or the repo's rules-test setup): unauthenticated cannot read/write `socialClicks`; a member can read; no client can write; a manager cannot change `trialStatus/trialEndsAt`; existing public reads (`publicProfiles`, `memberCards get`, `serviceItems`, `menus`, slug) still pass; existing member/manager writes still pass. **Do not deploy.** Output a **copy-ready `firestore.rules`** for manual paste into Firebase Console.
4. **Full regression (manual)** across café/restaurant (menu+tables+orders+KDS), salon (services+staff+booking+calendar), retail (catalogue), gym (members+check-in+classes), carwash (services+bundles+passes), generic services; `/card,/menu,/book,/catalog,/services`; order+booking; loyalty/CRM; mobile + light/dark.
5. **Security verification** (§6.1): confirm no PIN/email/member/ownerUid in any public projection or the click endpoint; social settings require manager; clients cannot write `socialClicks` or self-extend the trial. **Re-document the two pre-existing findings** (plaintext PINs; untrusted client stamp/redeem/order mutations) as open security-phase items — do not attempt their full fix.
6. `npx tsc -b`, `npm run lint`, `npx vite build` all green.

**Tests:** the full §12 matrix (record pass/fail per item) + the emulator rule assertions above.
**Acceptance:** §15 in full. **Final factual report required**: regression checklist with results, the copy-ready rules file + per-rule explanation, emulator validation output, confirmed security posture, deferred items, and exact build/lint/typecheck output.
