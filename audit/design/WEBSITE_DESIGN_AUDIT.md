# Loyaltydigitalqr — Website-Wide Design Audit & Redesign Plan

**Scope:** marketing site, auth and onboarding, merchant dashboard (all 7 business types), customer-facing pages (loyalty card, menu, ordering, booking, catalogue, tracking) and the kitchen display.
**Method:** full source scan of every `.tsx` file and the global CSS, measured counts of type sizes, colours, radii and shadows, plus a visual review of 80+ screenshots at 375/390/768/1024/1440/1536 px in light and dark mode, and the current onboarding and dashboard screenshots.
**Status:** analysis only. No code was changed.

---

## 0. Executive summary

The marketing homepage has a strong concept: a bold headline, a lime/cobalt accent and a playful hero collage. **The product behind it does not match that quality.** Five root causes drive almost every visual weakness:

| # | Root cause | Evidence | Effect |
|---|---|---|---|
| 1 | **Most text is far too small.** | 563 elements at 8.5–11px and 901 at 12px (`text-xs`), against about 950 at every larger size combined. | Dashboards feel cramped, "developer-ish" and hard to read. Fails legibility on phones. |
| 2 | **Labels use the system monospace font.** | `font-mono` is used 550 times, almost always as tiny UPPERCASE labels. It resolves to Consolas or Menlo because no mono web font is loaded. | This is the "thin, weak" look in the onboarding screenshot ("LOYALTY PROGRAM TITLE", "VISITS REQUIRED…"). |
| 3 | **Font weights that are never loaded.** | `font-black` (900) is used 361 times and `font-extrabold` 5 times. Space Grotesk is loaded at 500/700 only and Inter at 400–700 only. | The browser fakes the boldness, so headings look smeared and inconsistent between browsers. |
| 4 | **No design tokens; 84 hard-coded hex colours.** | `#111318` appears 895×, `#F7F3EB` 802×, `#E5E3DB` 605×, and so on, repeated inline with `dark:` duplicates. About 530 classes reference tokens that don't exist (`text-foreground`, `border-border`, `bg-primary`, `text-muted…`). | **7 screens render partly unstyled** (see P0-1). Any colour change means editing hundreds of lines. |
| 5 | **Two different brands per theme.** | Light theme: cobalt `#3027F5` primary. Dark theme: gold `#E4C174` primary. The hero art stays cobalt and lime in both. | The dark site shows three competing accents, and the product doesn't feel like one brand. |

Fixing these five, in the order below, delivers about 80% of the visual uplift before any page is redesigned.

---

## 1. Priority 0: broken or misleading (fix first)

### P0-1. Seven dashboard screens are partly unstyled
- **Location:** `gym/GymCheckInView`, `gym/GymClassesView`, `carwash/CarWashServicesView`, `carwash/CarWashBundlesView`, `carwash/CarWashVisitsView`, `service/GenericServicesView`, `service/GenericVisitView`.
- **Current issue:** these files use shadcn-style tokens (`bg-primary`, `text-primary-foreground`, `border-border`, `text-muted-foreground`, `bg-muted`, `bg-background`, `text-foreground`) that are **not defined** in `index.css @theme`. Tailwind v4 generates nothing for them, which I confirmed by searching the built CSS. Visible effects in the screenshots:
  - The primary action ("Confirm Check-In", "Redeem & Record Wash") has **no background** and reads as plain text.
  - Every border falls back to a harsh full-white or black `currentColor`.
  - Secondary text has no muted colour, so the screen has no hierarchy.
- **Recommended improvement:** define the semantic tokens once (see §3.1). These seven screens then pick up correct styling automatically. Afterwards, migrate the other ~40 files to the same tokens.
- **Priority:** **High.** This is visibly broken for three of the seven business types.

### P0-2. Onboarding reward text contradicts the stamp count
- **Location:** `OnboardingPage` step 4 → `LoyaltyCardPreview`.
- **Current issue:** choosing 10 stamps leaves the default reward "Buy 8 coffees, get your 9th drink free". The preview then shows "EARN REWARD AT 10 STAMPS / Buy 8 coffees…", and that wording is saved into the live program.
- **Recommended improvement:** while the reward text is still an unedited default, regenerate it from the count ("Buy {n}, get your {n+1}th free"). Once the user has typed their own text, leave it alone.
- **Priority:** **High** (customers see the contradiction).

### P0-3. Developer and QA language on merchant screens
- **Location:** Analytics ("Audit-grade CSV exported", "Zero-Division Safety…", "Metrics aggregated truthfully", "isolated to Good Day (biz_user_primary)"). Loyalty Program ("COUNTER STAMPING SPECIFICATION", "ID: prog_user_primary", "Model: Digital Stamp Card"). Overview ("Counter stamp scans").
- **Current issue:** internal test vocabulary and raw database IDs are shown to business owners.
- **Recommended improvement:** remove the IDs. Rewrite in plain merchant language: "Report downloaded", "How stamping works", "Your loyalty card".
- **Priority:** **High** (erodes trust immediately).

### P0-4. Low-contrast text fails accessibility
- **Location:** everywhere `#868A94` is used on `#F8F7F2` or white (394 uses): placeholders, sub-labels, footer links ("How it works", "Master Loyalty Card", "All Industries" look disabled), table meta and time stamps.
- **Current issue:** about 3.2:1 contrast at 10–12px. WCAG AA needs 4.5:1 for small text.
- **Recommended improvement:** muted text becomes `#5B5F69` (≈5.9:1 on cream) and subtle text `#6E727C` (≈4.7:1). Never put muted text below 13px. Footer links should be ink at 70% opacity, not a disabled-looking grey.
- **Priority:** **High.**

---

## 2. Typography system

### 2.1 Current state (measured)
| Problem | Count / detail |
|---|---|
| Text ≤ 11px | 563 (`text-[10px]` 338, `text-[11px]` 207, `text-[9px]` 15, `text-[8.5px]` 3) |
| Text at 12px (`text-xs`) | 901, the single most common size in the product |
| One-off arbitrary sizes | 13, 13.5, 14.5, 15, 15.5, 16.5, 17, 52, 62, 72, 76 px: no scale |
| Weights | `font-bold` 939, `font-black` 361 (not loaded), `font-semibold` 218, `font-medium` 59. Regular body weight is almost never set deliberately. |
| UPPERCASE + wide tracking | 395 uppercase, 171 `tracking-wider/widest`. Eyebrows, labels and table heads all shout equally. |
| Families | 3 web fonts loaded for UI (Inter, Plus Jakarta Sans, Space Grotesk) plus system mono. **Plus Jakarta Sans is downloaded at 5 weights but only used as a fallback.** |

### 2.2 Recommended families (two UI families plus one accent)
| Role | Family | Weights to load | Why |
|---|---|---|---|
| Display and headings | **Plus Jakarta Sans** (already loaded, supports 800) | 600, 700, 800 | Confident, friendly geometric. Has real heavy weights, so no fake bold. Reads premium at large sizes. |
| UI and body | **Inter** (variable, `opsz` axis) | 400, 500, 600, 700 | Best-in-class small-size legibility. Enable `font-feature-settings: "cv11","ss01"` and `font-variant-numeric: tabular-nums` for all numbers. |
| Codes only | **JetBrains Mono** (or Geist Mono) | 500, 600 | Use **only** for PINs, voucher codes, order and booking numbers, licence plates and SKUs. Never for labels. |
| Hand-drawn accents | Caveat (keep) | 600 | Hero annotations only. |

**Drop Space Grotesk.** Its widest weight is 700, which is the source of the faux-bold headings, and its quirky shapes clash with Inter in dense UI.

### 2.3 Type scale (rem at 16px root; desktop / mobile)
| Token | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| `display` | `clamp(2.75rem, 2rem + 3.2vw, 4.75rem)` / 1.02 | 800 | -0.035em | Marketing hero only |
| `h1` | 2.25rem / 2.6rem (mobile 1.875rem) | 800 | -0.025em | Marketing section titles, pricing |
| `page-title` | 1.75rem / 2.125rem (mobile 1.5rem) | 700 | -0.02em | Dashboard page title ("Customer Members") |
| `h2` | 1.375rem / 1.75rem | 700 | -0.015em | Card and panel titles |
| `h3` | 1.125rem / 1.5rem | 600 | -0.01em | Sub-panels, list item titles |
| `body-lg` | 1.0625rem / 1.75rem | 400 | 0 | Marketing paragraphs |
| `body` | 0.9375rem (15px) / 1.5rem | 400 | 0 | **Default dashboard text** |
| `body-sm` | 0.875rem / 1.25rem | 500 | 0 | Secondary text, table cells |
| `caption` | 0.8125rem (13px) / 1.125rem | 500 | 0.005em | Meta, timestamps, helper text |
| `label` | 0.8125rem / 1rem | 600 | 0 | Form labels, **sentence case** |
| `eyebrow` | 0.75rem (12px) / 1rem | 600 | 0.08em uppercase | Max **one** per section |
| `stat` | 2rem / 2.25rem (mobile 1.75rem) | 700 | -0.02em, tabular | KPI numbers |
| `stat-sm` | 1.375rem / 1.75rem | 700 | tabular | Inner metrics |

**Rules**
1. Nothing below 12px. Nothing below 13px if it's muted.
2. Form labels: sentence case, Inter 600 13px, ink colour. Not mono, not uppercase.
3. Table headers: Inter 600 12px uppercase, tracking 0.04em, muted ink. Not mono, not 9px.
4. Only one eyebrow per section. Delete eyebrows that repeat the title ("CUSTOMER RELATIONSHIP MANAGEMENT" above "Customer CRM").
5. Never type a heading in ALL CAPS ("CAFE PERFORMANCE METRICS" → "Café performance").
6. Every number gets `tabular-nums` so values don't jitter as they update live.

### 2.4 Where to apply first (files with the most tiny text)
`OverviewView` (56 ≤11px + 24 xs), `CampaignsAndOffersView` (35 + 50), `AnalyticsView` (29 + 18), `SalonAppointmentsView` (22 + 39), `CafeOrdersView` (19 + 26), `LoyaltyProgramView` (19 + 17), `MasterLoyaltyWallet` (17), `OnboardingPage` (15 + 47), `CustomerCrmView`, `QrStudioView`, `PublicBookingPage` (13 + 34).

---

## 3. Colour system

### 3.1 Semantic tokens (define once in `index.css`, swap values for dark)
| Token | Light | Dark | Notes |
|---|---|---|---|
| `--color-bg` | `#F7F6F2` | `#0B0B0C` | Page canvas (warm cream kept) |
| `--color-surface` | `#FFFFFF` | `#141416` | Cards |
| `--color-surface-2` | `#F1EFE9` | `#1C1C1F` | Insets, table heads, input fill |
| `--color-border` | `#E6E3DA` | `#2A2A2F` | Default 1px border |
| `--color-border-strong` | `#D3CFC3` | `#3A3A41` | Inputs, focus base |
| `--color-text` | `#14161B` | `#F5F3EE` | Primary ink |
| `--color-text-muted` | `#5B5F69` | `#B3AFA6` | Secondary (AA) |
| `--color-text-subtle` | `#6E727C` | `#8E8A82` | Tertiary (AA ≥ 13px) |
| `--color-primary` | `#3027F5` | `#7A73FF` | **Same brand hue in both themes**, lifted for dark contrast |
| `--color-primary-hover` | `#2219D9` | `#958FFF` | |
| `--color-primary-soft` | `#ECEBFF` | `rgba(122,115,255,.14)` | Selected rows, active nav |
| `--color-on-primary` | `#FFFFFF` | `#0B0B0C` | |
| `--color-reward` | `#C8962E` | `#E4C174` | Gold = **rewards and premium only** (unlocked, VIP) |
| `--color-highlight` | `#D6FF38` | `#D6FF38` | Lime = marketing highlights only (hero underline, illustrations) |
| `--color-success` / `-soft` | `#0E8A5F` / `#E6F6EF` | `#34D399` / `rgba(52,211,153,.12)` | |
| `--color-warning` / `-soft` | `#B45309` / `#FEF3E2` | `#FBBF24` / `rgba(251,191,36,.12)` | |
| `--color-danger` / `-soft` | `#C8102E` / `#FDECEE` | `#F87171` / `rgba(248,113,113,.12)` | |

Also define the alias names already used by the 7 broken screens (`--color-background`, `--color-foreground`, `--color-muted`, `--color-muted-foreground`, `--color-primary-foreground`, `--color-border`) and point them at the tokens above. That alone repairs P0-1.

### 3.2 Colour rules
1. **One brand colour (cobalt) in both themes.** Gold is demoted from "dark-mode primary" to "reward colour". This removes the three-accent clash in the dark hero and dashboard (gold nav pill, gold CTAs, cobalt "View Reward", lime blob).
2. **KPI numbers are ink, not rainbow.** Today the Customers page shows orange "1", blue "52", black "18", and Analytics shows green "$24.70", orange "4.7", blue "1". Colour should only appear on deltas and status chips ("+12% vs last week", "Reward ready").
3. Status colours always pair `-soft` backgrounds with dark text: "Expired", "Exhausted", "Sold out" and "Reward ready" chips.
4. Business accent colour (chosen at onboarding) applies **only** to that business's customer-facing card and pages, never to dashboard chrome.

---

## 4. Spacing, layout, radii, borders, shadows

### 4.1 Spacing scale (4px base)
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128`. Ban the half-steps currently in use (`p-3.5` 88×, `p-2.5` 18×, `p-1.5` 44×).

| Context | Value |
|---|---|
| Card padding | 24px (compact cards 16px). Never mix 14/18/20 on one screen. |
| Gap between cards in a grid | 24px desktop, 16px mobile |
| Dashboard page padding | 32px desktop, 24px tablet, 16px mobile |
| Dashboard vertical rhythm | 32px between sections; 8px title → description; 24px header → content |
| Marketing section padding | 96–128px desktop, 64px mobile |
| Form field stack | 20px between fields, 6px label → input |

### 4.2 Layout
| Location | Issue | Recommendation | Priority |
|---|---|---|---|
| Dashboard main column | Grows edge to edge at 1536px; KPI rows stretch thin. | `max-width: 1320px; margin-inline: auto`. 12-column grid, 24px gutters. | Medium |
| Dashboard sidebar | Full cobalt pill (light) or gold pill (dark) on the active item is very heavy; group labels are 9px mono. | Active item: `--color-primary-soft` background, primary text, 3px left indicator. Group labels: 12px Inter 600 uppercase, subtle colour. Item text: 15px Inter 500. | Medium |
| KPI rows | 4 equal cards, tiny labels, icon top-right. | Label 13px 500 muted (top), value `stat` 32px (middle), delta or meta 13px (bottom); icon in a 36px soft-tinted square. 2×2 on mobile with 16px padding. | High |
| Customers table | Uses a CSS grid that collapses awkwardly; meta text 11px. | Real table semantics on desktop; stacked list cards below 768px (name, progress bar, primary action). Row height 64px, avatar 40px. | Medium |
| Kitchen display | Tickets wrap as one row and leave a large empty canvas. Column meaning is unclear. | Three status columns (New, Preparing, Ready) as a kanban, each scrolling. Ticket number 28px tabular; elapsed timer as a coloured chip (green < 5 min, amber 5–10, red > 10). Touch targets ≥ 48px. | Medium |
| Public booking (desktop) | Narrow single column (~736px) with large empty sides; "Select" is a tiny text link. | Keep the single column on mobile. On ≥ 1024px use a 2-column service grid plus a sticky summary panel (service, time, price). Whole card clickable with a clear 40px "Select" button. | Medium |
| Analytics | Mixed card sizes, ALL-CAPS headings, nested cards inside cards. | One row of 4 KPIs, then a 2/3 + 1/3 split (performance chart + campaign summary). Avoid card-in-card more than one level deep. | Medium |
| Onboarding | Footer, card and marketing header all compete; the "Continue" button is **gold in light mode** on step 1. | Distraction-free layout: logo plus a step indicator only, no marketing footer. Primary button always `--color-primary`. Sticky bottom action bar on mobile. | High |

### 4.3 Radii
Currently in use: `rounded-xl` 548, `rounded-2xl` 268, `rounded-lg` 188, `rounded-3xl` 145, plus arbitrary 24/26/32/36 px.

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 8px | Chips, badges, small icon buttons |
| `radius-md` | 12px | Buttons, inputs, selects, tabs |
| `radius-lg` | 16px | Cards, list rows, dropdowns |
| `radius-xl` | 24px | Modals, hero panels, loyalty card faces |
| `radius-full` | 9999px | Pills, avatars, toggles |

### 4.4 Borders and shadows
| Issue | Recommendation |
|---|---|
| `border-2` on 45 large containers (login card, onboarding card, settings panel, card preview) makes them look heavy and dated. | 1px `--color-border` everywhere. Use 2px only for focus and selected states. |
| Shadows are inconsistent (`shadow-xs` 194, `shadow-md` 85, `shadow-2xl` 55 on ordinary cards, plus custom glows). | Three elevations: `e1 = 0 1px 2px rgb(20 22 27 / .06)` for cards; `e2 = 0 8px 24px -8px rgb(20 22 27 / .12)` for hover and dropdowns; `e3 = 0 24px 64px -16px rgb(20 22 27 / .24)` for modals and hero mock-ups. In dark mode replace shadows with a 1px border plus `inset 0 1px 0 rgb(255 255 255 / .04)`. |
| Coloured glow under gold CTAs (`shadow-[0_4px_20px_rgba(228,193,116,0.3)]`). | Remove. A flat primary with an `e1` shadow and hover lift looks more premium. |

---

## 5. Components

| Component | Current issue | Recommendation | Priority |
|---|---|---|---|
| **Buttons** | Height varies from 28 to 56px; label 12–16px; colour and border-2 combinations ad hoc; the primary is gold in some light screens. | Sizes: `sm` 32px/13px, `md` 40px/14px, `lg` 48px/15px, all Inter 600 with 16/20px horizontal padding and `radius-md`. Variants: primary (filled), secondary (surface + 1px border), ghost, danger, success. Focus ring: `0 0 0 3px` primary-soft plus a 1px primary outline. | High |
| **Inputs and selects** | 40px tall, 14px text, label in 10–11px mono uppercase, placeholder `#868A94` (low contrast), native `<select>` chevrons. | 44px tall, 15px text, `surface-2` fill, 1px `border-strong`, `radius-md`. Label 13px Inter 600 sentence case; 13px helper and error text below. Custom chevron. Error state: danger border plus icon. | High |
| **Badges / chips** | 8.5–10px mono uppercase ("REWARD READY", "JUST NOW", "ACTIVE"). | 12px Inter 600, sentence or title case, 22px tall, `radius-full`, soft background with strong text. | High |
| **Tabs / segmented control** | 10–11px mono labels ("7 Days / 30 Days"). | 14px Inter 500; active tab is a surface pill with `e1`; 36px tall. | Medium |
| **Stat card** | Covered in §4.2. | One shared component; the same layout everywhere (Overview, Customers, Loyalty, Analytics, gym, car wash). | High |
| **Modal** | `shadow-2xl`, border-2, mixed headers (mono eyebrow + title + X). | `radius-xl`, `e3`, 24px padding, title 20px 700, 15px description, footer actions right-aligned (`md` buttons). Full-height sheet on mobile. | Medium |
| **Empty states** | Plain dashed boxes with 12px grey text. | Icon (40px, soft tint) + 16px 600 title + 14px description + primary action. | Medium |
| **Toasts / notices** | Inline green bars with 12px text; some contain jargon. | A single toast component at bottom-right (bottom-center on mobile), 14px, auto-dismiss after 4s. | Low |
| **Header (marketing)** | Good. Nav links 15px. | Keep; make the active link primary and the CTA `lg`. | Low |
| **Footer** | Several links look disabled (light grey). Small © row. | Links 15px at 70% ink, hover full ink; 4 columns; 48px top padding. | Medium |

---

## 6. Business loyalty card redesign

### 6.1 What's wrong today
- **One generic layout for every business** (`LoyaltyCardPreview`, the customer card page, and the dashboard preview): a white box, an initial avatar, a pink banner, and grey numbered squares.
- Stamps are **numbered grey tiles with a check mark**: no sense of place, no delight, and they look like a form.
- Typography: 10px mono program name, 10px uppercase "EARN REWARD AT N STAMPS", 10px mono footer. The reward (the most important thing) is 12–14px.
- The card reuses dashboard chrome (thin borders, cream insets), so it doesn't feel like something a customer wants to keep.
- Four different card implementations drift apart: the hero `MasterLoyaltyWallet`, the homepage `CardBuilderModal` (only 5 of 7 categories: no car wash or "other"), `LoyaltyCardPreview`, and `PublicLoyaltyCardPage`.

### 6.2 Shared anatomy (all categories)
Taken from your references, adapted rather than copied:

```
┌──────────────────────────────────────────┐  radius 28px, full-bleed category background
│ [logo 40px]  Business name        #0256  │  name 18/700 · member no. 13 mono, 70% opacity
│              Program name                │  13/500, 75% opacity
│ ┌──────────────────────────────────────┐ │
│ │  ☕ ☕ ☕ ☕                           │ │  INSET PANEL (radius 20px, contrasting tint)
│ │  ◌ ◌ ◌ ◌     themed stamp icons      │ │  earned = solid icon · remaining = 35% ghost
│ └──────────────────────────────────────┘ │
│  Stamps  05            Remaining  03     │  label 12/600 · value 24/800 tabular
│  ─────────────────────────────────────── │
│  🎁 Free coffee after 8 visits           │  reward 15/600 (most prominent text line)
│ ┌──────────┐                             │
│ │  QR/code │  Show this at the counter   │  white tile with member QR or short code
│ └──────────┘                             │
└──────────────────────────────────────────┘
```

- **Proportions:** a tall wallet pass at 340×480 (preview) and full width up to 420px on the customer page. Use a fixed aspect for previews so the onboarding, dashboard and builder previews all look identical.
- **Stamp grid:** 4 columns when 8 or fewer stamps; 5 columns for 10; 6 for 12. Icons 32–40px, centred in 56px cells.
- **One component, many themes:** a single `<LoyaltyCard theme={businessType} accent={…} stamps={…} />`, styled through CSS variables (`--card-bg`, `--card-ink`, `--card-inset`, `--stamp-on`, `--stamp-off`, `--card-accent`). Used by the hero, the card builder, onboarding, the dashboard preview and the public card page, so they can never drift again.
- **Motion:** a newly earned stamp scales from 0.6 to 1 with a 320ms spring and a soft ring pulse. When the reward unlocks, the inset panel glows in the reward colour and the reward line becomes a voucher. Respect `prefers-reduced-motion`.
- **Accent colour:** the merchant's chosen accent tints `--card-accent` (stamp-on, reward icon). The background stays theme-defined so text contrast is guaranteed. Validate contrast of accent against inset (≥ 3:1 for icons).

### 6.3 Per-category visual identities
| Category | Palette (bg / inset / ink / stamp-on) | Stamp motif | Distinct details | Type accent |
|---|---|---|---|---|
| **Café / coffee** | Espresso `#3B2418` / crema `#F2E4D2` / `#FFF8EF` / `#7A4A2E` | Coffee cup (solid when earned, a small heart on the earned cup) | Subtle radial "steam" gradient at the top right; a soft paper grain at 3% opacity | Business name in Plus Jakarta 800 |
| **Restaurant / bistro** | Wine `#4A1520` / linen `#F6EFE6` / `#FFF7F0` / brass `#C59A3A` | Plate with cutlery | Ticket-style card with a perforated divider (dashed 2px line plus half-circle notches) above the QR section | Optional serif for the name only (**Fraunces 600**) for a dining feel |
| **Salon / barber** | Charcoal `#18181B` / bone `#EDE6DA` / `#FAF7F2` / `#18181B` | Barber chair (barber) or scissors | Thin red-white-blue barber-stripe band (4px) at the top edge; matte finish | Name in Plus Jakarta 800, wide tracking 0.02em |
| **Salon: beauty / nails** (sub-theme) | Rose `#A3233F` / blush `#FBE7EC` / `#FFF5F7` / `#A3233F` | Nail / polish bottle | Soft glossy highlight across the top (linear-gradient 120°, 8% white) | Same as above |
| **Retail / boutique** | Ivory `#FBF8F3` / white `#FFFFFF` with 1px `#E8E1D6` / ink `#16130F` / emerald `#0F6B5C` | Shopping bag | Editorial: generous whitespace, hairline borders, tag-shaped card with a punched hole at the top centre | Name set larger (24px), letter-spaced uppercase 0.12em |
| **Gym / fitness** | Graphite `#0E1013` / `#1B1F24` / `#F4F6F8` / volt `#C6FF3D` | Lightning bolt or dumbbell; **or** a progress ring for streak programs | Diagonal 135° accent stripe; numbers in condensed heavy type | Stats in **Barlow Condensed 800** (stamp count 32px) |
| **Car wash / detailing** | Deep blue `#0B3EA8` → cyan `#1DB4E8` gradient / white 92% / `#FFFFFF` / `#0B3EA8` | Car silhouette or water droplet | "Wet" glossy highlight band; bubble dots in the corner at 10% opacity; label "Washes left" instead of "Remaining" | Plus Jakarta 800 |
| **Other services** | Slate `#1E293B` / `#F1F5F9` / `#F8FAFC` / teal `#0D9488` | Check-badge or wrench-star | Clean, professional; small grid-dot pattern in the inset | Plus Jakarta 700 |

**Wording per category:** visits, cups, cuts, washes, workouts, purchases. Replace the generic "stamps/visits" inside the card with the category noun ("6 more cuts to a free beard trim").

### 6.4 Where the new card appears
1. **Customer card page** (`/card/…`): full size, the hero of that page. Add "Add to home screen" guidance and a large member code for staff lookup.
2. **Onboarding step 4:** live preview updates instantly with name, accent, stamp count and category.
3. **Dashboard → Loyalty Program:** preview plus "Edit design" (accent, category sub-theme, logo).
4. **Homepage card builder:** all 7 categories (add car wash and "other service"), using the same component.
5. **Hero collage:** reuse the café theme so the marketing promise matches the product.

---

## 7. Page-by-page findings

| Location | Current issue | Recommended improvement | Styling direction | Priority |
|---|---|---|---|---|
| **Home / hero** | Strong, but body copy is 17px grey on cream; trust row 13px grey; step strip below with 13px descriptions. Dark mode uses gold CTA plus cobalt card plus lime blob. | Keep the composition. Body 18px/1.6 muted; trust row 14px 500 ink-70. Dark mode: cobalt primary CTA, lime stays as the illustration highlight. | `display` scale, Plus Jakarta 800, -0.035em | Medium |
| **Home / sections** | Sections vary in padding; many 12–13px captions; mono eyebrows. | Uniform 112px vertical rhythm; eyebrows as Inter 600 12px uppercase; card grids with 24px gaps. | §2.3, §4.1 | Medium |
| **Pricing** | Good hierarchy. Mono 10px "FIRST 30 DAYS FREE", 13px feature list, double-border cards. | Feature list 15px with 20px check icons; price `display`-sized number with a 16px "/month"; 1px border plus `e1`, `e2` on hover. | | Medium |
| **Login / signup** | Card uses border-2 and heavy shadow; mono labels; divider label in mono. | 440px card, 1px border, `e2`; labels 13px Inter 600; social button 48px; divider "or" 13px muted. | | Medium |
| **"Check your email" screen** | New. Already uses larger type; aligns with the new system. | Match the card spec above; add the mail-app quick link. | | Low |
| **Onboarding** | Gold primary in light mode (step 1); 10px mono labels; business-type cards with 12px descriptions; reward text bug (P0-2). | Primary = cobalt. Type cards: 48px icon tile, 16px 600 title, 14px description, 20px padding, selected = primary border plus soft fill plus check. Labels 13px sentence case. | | High |
| **Dashboard overview** | 9–10px mono stat labels; coloured numbers; cramped "Kitchen & Table Queue" sub-cards; trial chip 9px. | Stat card spec; trial chip 12px; queue as 4 compact stat tiles (`stat-sm`). | | High |
| **Loyalty Program view** | Jargon, a generic card preview, an IDs line, and a stamping log with 11px rows. | New card component; plain-language copy; activity log rows at 14px with 13px meta. | | High |
| **Customers (CRM)** | Progress text in mono "8 / 10 visits"; 11px "2 to reward"; small actions. | Progress label 14px 600 tabular; a thin 6px progress bar with radius; "Stamp" as a `sm` secondary button; "Redeem" as a success button. | | High |
| **QR Studio** | Small labels; QR card meta at 10–11px. | QR card: 200px QR on white with 16px padding, title 16px 600, URL 13px mono (it's a code). Actions as an icon-button group. | | Medium |
| **Orders / KDS** | See §4.2; tiny "1 ITEMS" (also a grammar bug); mono timestamps. | Kanban; "1 item / 3 items" pluralised; ticket number 28px. | | Medium |
| **Salon calendar / appointments** | Dense 10–11px everywhere; weak status colours. | Calendar events 13px 600 title plus 12px time; status as a left 3px colour bar plus soft background. | | Medium |
| **Gym / car wash / services** | Broken tokens (P0-1); after the fix, same tiny-type issues. | Token fix, then the stat card plus list patterns. | | High |
| **Offers & promos** | 50 `text-xs` plus 35 tiny elements; dense forms. | Form spec §5; offers as cards with a code chip (mono 14px). | | Medium |
| **Analytics** | Jargon (P0-3); rainbow numbers; ALL-CAPS heading; no charts. | KPI row plus one trend chart (visits per day), then breakdown cards. | | Medium |
| **Settings** | Tabs ok; inputs and labels follow the old pattern; role matrix 12px. | Form spec; role matrix 14px with clear check icons. | | Low |
| **Public menu (mobile)** | Good base. Category pills 14px; dietary chips 12px; "Sold out" card at 60% opacity reduces readability. | Item title 17px 600, price 17px 700 tabular, description 14px muted; sold-out keeps full-contrast text with a "Sold out" chip. | | Medium |
| **Public booking** | §4.2; category chip duplicates ("HaircutsGrooming" is a data label). | 2-column desktop; sticky summary; chips 14px. | | Medium |
| **Order / appointment tracking** | Small status text; progress steps compressed. | Large status headline (24px 700) plus a vertical step timeline with 14px labels and timestamps. | | Medium |

---

## 8. Responsiveness

| Breakpoint | Issue | Recommendation |
|---|---|---|
| ≤ 390px | 10px labels become about 9px effective on high-DPI phones; KPI cards in 2 columns squeeze 32px numbers; tables overflow; KDS unusable. | Minimum 12px text; KPI 2×2 with `stat` at 28px; tables → stacked cards; sticky bottom action bar in onboarding and booking; 44px minimum touch targets. |
| 768–1023px | Dashboard sidebar becomes a drawer, but the page header still has 3 right-side controls (Counter kit, bell, theme). | Collapse the header actions into an overflow menu below 1024px. |
| ≥ 1440px | Dashboard content stretches; booking leaves wide empty gutters. | `max-width: 1320px` for the dashboard; 2-column booking. |

---

## 9. Roll-out plan (recommended order)

1. **Foundation (≈1 day):** semantic colour tokens, including aliases (fixes P0-1); load the correct font weights; type-scale utilities; spacing, radius and shadow tokens. Copy fixes for P0-2 and P0-3.
2. **Core components (≈2 days):** Button, Input/Select/Label, Badge, Tabs, StatCard, Modal, EmptyState, Table/List row. Remove all `font-mono` labels and every `text-[8.5–11px]`.
3. **Loyalty card system (≈2 days):** one `<LoyaltyCard>` with 7 category themes and motion, used in all 5 places.
4. **Dashboard pages (≈2–3 days):** Overview → Loyalty → Customers → QR → Orders/KDS → Salon → Gym/Car wash/Services → Offers → Analytics → Settings.
5. **Customer-facing pages (≈1–2 days):** card page, menu, booking, tracking, catalogue.
6. **Marketing polish (≈1 day):** hero dark mode, section rhythm, pricing, footer contrast.
7. **QA:** both themes at 375/768/1024/1440; check contrast with an automated tool; run the existing regression suite.

---

## Appendix A: measured inventory (current code)

- **Text sizes:** text-xs 901 · text-[10px] 338 · text-sm 339 · text-[11px] 207 · text-xl 134 · text-base 118 · text-2xl 93 · text-lg 75 · text-3xl 56 · text-[9px] 15 · text-4xl 12 · text-5xl 13 · text-6xl 9 · plus 17 one-off arbitrary sizes.
- **Weights:** bold 939 · black 361 · semibold 218 · medium 59 · extrabold 5 · normal 2.
- **Families:** font-mono 550 · font-heading 407 · font-handwriting 3.
- **Case:** uppercase 395 · tracking-widest 95 · tracking-wider 76.
- **Colours:** 84 unique hex values inline; top: #111318 (895), #F7F3EB (802), #E4C174 (733), #3027F5 (679), #E5E3DB (605), #60646C (432), #868A94 (394). Tailwind palette: emerald 411, amber 356, red 323, rose 87.
- **Undefined tokens:** about 530 uses across 7 files (P0-1).
- **Radii:** xl 548 · 2xl 268 · lg 188 · 3xl 145 · full 137 · + arbitrary 24/26/32/36 px.
- **Shadows:** xs 194 · md 85 · 2xl 55 · sm 42 · xl 30 · lg 16 · + 6 custom glows.
- **Borders:** `border-2` used on 45 large containers.

*Visual review source:* `audit/design-snapshots/` (captured 27–29 Oct, before the Firebase work; layout and styling are unchanged since, only copy and data changed) plus your current onboarding and dashboard screenshots. Brand wordmark checked against the current `Logo.tsx`; an older snapshot showing "LoyaltyQRCode" is outdated and not a current issue.
