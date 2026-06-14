## BeenThere

Private photo galleries for events. Guests scan a QR code to see and share
photos without downloading an app, joining a group chat, or exchanging contact
details.

This repository currently contains the Milestone 1 scaffold:

- Next.js App Router + TypeScript + Tailwind
- demo landing page and join flow
- event gallery with display-name/consent gate before upload
- local upload preview fallback when services are not configured
- Supabase-backed event/participant/photo lookup when configured
- R2 signed upload reservation and completion APIs
- Sharp-based thumbnail/preview processing service
- initial Supabase schema for events, participants, sessions, photos, favorites,
  reports, upload reservations, and exports

## Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then use the demo event
link from the landing page.

## Environment

Copy `.env.example` to `.env.local` and fill in real service values when ready.
Without R2 credentials, the upload UI stays in local demo mode and the signed
upload API returns a clear `501` response.

Required for real uploads:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `POSTGRES_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

## Database

The initial database design is in `supabase/schema.sql`. It creates a dedicated
`beenthere` schema and keeps app tables/types/functions out of `public`.
It uses `event_participants` as the central event identity model so temporary
guests, verified users, hosts, cohosts, and future session merging all share one
model.

Run `supabase/schema.sql`, then `supabase/seed.sql` in a Supabase SQL editor to
create the demo event. The seeded join URL is:

```text
/join/demo-join-token
```

## Host Authentication

The host dashboard (`/dashboard`) requires Google sign-in via Supabase Auth.
Access is limited to emails in `HOST_EMAIL_ALLOWLIST` (comma-separated). The
same allowlist will exempt those accounts from the paywall once billing ships.

One-time Supabase setup:

1. In Google Cloud Console, create an OAuth 2.0 Client ID (Web application).
   Add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized
   redirect URI.
2. In the Supabase dashboard, go to Authentication → Providers → Google,
   enable it, and paste the client ID and secret.
3. In Authentication → URL Configuration, add your app origins (e.g.
   `http://localhost:3000/**`) to the redirect allow list.

The app handles the rest: `/login` starts the OAuth flow and
`/auth/callback` exchanges the code for a session cookie.

## Billing (RevenueCat)

Any signed-in Google user can create draft events for free. Taking an event
live is the paywall: it requires an active RevenueCat entitlement (default id
`host`), checked server-side. Emails in `HOST_EMAIL_ALLOWLIST` bypass billing
entirely.

One-time RevenueCat setup:

1. Create a RevenueCat project and a **Web Billing** app (this connects to a
   Stripe account for processing).
2. Create a product, attach it to the default offering, and create an
   entitlement named `host` granted by that product.
3. Copy the Web Billing public key into `NEXT_PUBLIC_REVENUECAT_WEB_API_KEY`
   and a secret API key into `REVENUECAT_SECRET_API_KEY`.

Until the keys are set, activation responds 402 for non-allowlisted users and
the upgrade page explains that billing isn't configured.

## R2 CORS

The browser uploads directly to R2, so the bucket needs CORS that allows `PUT`
from your local and deployed origins. Example for local development:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

For local development without R2, set:

```env
LOCAL_UPLOADS_ENABLED=true
```

This stores originals and generated derivatives under `public/local-media`.
That folder is gitignored and is only intended for local testing.

## Next Milestone

Next work should move synchronous photo processing behind Trigger.dev, persist
guest browser sessions in `guest_sessions`, and add Supabase Realtime updates
for ready photos.
