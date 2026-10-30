# Loyaltydigitalqr

Digital loyalty cards, QR menus, bookings and catalogues for local businesses.
React + Vite frontend, Firebase Auth + Firestore backend, Cloudflare R2 for images.

## One-time Firebase console setup

1. **Firestore**: Build → Firestore Database → *Create database* (production mode, nearest region).
2. **Security rules**: Firestore → *Rules* → paste the whole of [`firestore.rules`](firestore.rules) → *Publish*.
3. **Invite index**: Firestore → *Indexes* → *Single field* → *Add exemption*:
   collection ID `invites`, field `email`, enable **Collection group** ascending.
   (Or run `npx firebase-tools deploy --only firestore:indexes`.)
4. **Authentication** → *Sign-in method*: enable **Email/Password** and **Google**.
5. **Authentication** → *Settings* → *Authorised domains*: add your live domain
   (`loyaltydigitalqr.web.app` is already there if you use Firebase Hosting).

## Environment

Copy `.env.example` to `.env` and fill in the Firebase web config.
`VITE_PUBLIC_APP_ORIGIN` is the https address printed into QR codes, so set it to your live domain.

## Image uploads (Cloudflare R2)

The R2 secret never goes into the browser. Uploads go through a small Worker
([`worker/`](worker)) that checks the user's Firebase session and business membership.

```bash
cd worker && npm install && npx wrangler login && npx wrangler deploy
```

Put the printed Worker URL into `.env` as `VITE_UPLOAD_API_URL`, add your live domain to
`ALLOWED_ORIGINS` in `worker/wrangler.toml`, and redeploy. Until then, logo upload is hidden.

## Run / build / deploy

```bash
npm install
npm run dev        # http://localhost:3000 (uses your real Firebase project)
npm run build
npx firebase-tools deploy --only hosting
```

Local testing without touching production: run `firebase emulators:start --only auth,firestore`
and start the dev server with `VITE_USE_EMULATORS=true`.

## Data model

| Path | Who can read | Who can write |
|---|---|---|
| `businesses/{id}` | its members | owner/manager (invitees can only add themselves) |
| `businesses/{id}/customers, orders, appointments, …` | members | members (catalogue/settings: owner/manager) |
| `businesses/{id}/menus, menuItems, salonServices, retailProducts, appointmentSlots` | everyone | owner/manager |
| `businesses/{id}/orders/{id}`, `appointments/{id}`, `memberCards/{id}` | anyone with the unguessable link | customers may create (validated) |
| `publicProfiles/{id}`, `slugs/{slug}` | everyone (single document) | owner/manager |

## Known limitations

- Billing is not automated. The trial end date is shown, but no payments are taken.
- Win-back campaigns export a CSV of opted-in customers. No SMS/email is sent by the platform.
- Team invites are not emailed. The invitee signs in with the invited address and accepts in the app.
- Prices on customer orders are calculated in the browser. Staff see the item list and total before accepting.
