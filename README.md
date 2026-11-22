# همیار داروخانه

Nuxt 4 / Vue / TypeScript staff console with Tailwind 4 and Pinia. Counter
workflows intentionally stay 360px wide on desktop and fit smaller screens.
Only the management area uses the wide dashboard layout.

## Local development

Use Node.js 22.23 or newer in the Node 22 line, or a current supported LTS.

```sh
npm ci
cp .env.example .env  # only if .env does not already exist
npm run dev
```

Open `http://localhost:3000`. Set `NOTIFY_DEV_STAFF_TOKEN` in `.env` to the
supplied development credential. This checkout is already configured; the
file is ignored by Git. Never paste the token into source code.

`NUXT_PUBLIC_API_BASE` defaults to `https://notify.hamidaroo.ir/api/v1`.
`NOTIFY_DEV_STAFF_TOKEN` is read only by the development configuration and
is excluded from static/production builds. Development browser requests
necessarily expose the development credential to that browser.

Production staff authentication remains a release decision. There is no
invented login endpoint or production shared-token deployment in this app.

## Backend setup needed: CORS

The console calls the backend directly. There are no Nuxt server routes or
reverse proxy. The backend must handle `OPTIONS /api/v1/*` before staff
authentication and return a successful response (200 or 204) with:

```http
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, Idempotency-Key
Vary: Origin
```

Send `Access-Control-Allow-Origin` on actual responses, including errors, too.
If allowing several development origins, validate the request's `Origin`
against an allowlist and return that origin; do not return a comma-separated
origin list. Add `http://127.0.0.1:3000` if using that address in the browser.
Browser cookies are not used (`credentials: omit`).

The initial read-only integration check found valid authentication and
category/priority options, empty education/product lists, and **404** responses
to both education GET and SMS POST preflights. Populate education through the
shop integration and products through the existing Aria integration to use
the live workflows.

```sh
npm run check:api
```

This checks preflights and authenticated reads without sending SMS or printing
the token or customer data. Override `NOTIFY_FRONTEND_ORIGIN` to check a
different development origin.

## Structure

```text
app/pages/                 route orchestration and local drafts
app/layouts/               narrow counter / wide management shells
app/components/ui/         domain-free accessible controls
app/components/counter/    shared counter presentation and phone validation
app/components/sms/        SMS-specific presentation and pattern forms
app/stores/                canonical server state, one store per resource
app/composables/useApi.ts  access to the shared client
app/utils/api-client.ts   transport, auth headers, timeout, cancellation, errors
app/types/api.ts           contracts from the supplied Swagger 2 schema
```

Stores capture the shared client during setup so asynchronous actions do not
depend on an active Nuxt setup context. List reads cancel superseded requests
and prevent older responses from replacing newer state. Query filters and
pagination in management lists are stored in the route query.

Mutations show explicit feedback. SMS confirmation/retry and settings changes
use shared confirmation. There are **no automatic transport retries**.
Education retries reuse the same idempotency key for an unresolved submission;
a deliberate next-customer action starts a new confirmation. Stock sends use
explicit request IDs, at most 100 for one product. A queued or provider-accepted
SMS is kept distinct from confirmed delivery; `review` does not offer resend.
Queue ordering and duplicate stock-request behavior remain backend-owned.

## Verification

```sh
npm run typecheck
npm test
npm run test:e2e
npm run generate
npm run verify:static
```

Browser tests use locally installed Google Chrome by default. Set
`PLAYWRIGHT_CHANNEL=chromium` and run `npx playwright install chromium` if
Chrome is not installed. They start a separate dev server on port 3100,
override authentication with a dummy token, and mock a `.test` API host.
They cannot send SMS to the live service. The suite covers the two counter
flows, idempotent retry, queue selection, SMS states, pattern mapping, URL
filters, access failure, narrow screens, and route reloads.

The app is client-rendered (`ssr: false`). `npm run generate` writes static
files to `.output/public`. Configure SPA fallback to `index.html` (or the
generated `200.html`) for non-asset application paths. Configure public API
settings at build time for static hosting. Production authentication, the
deployment target, and production CORS must be settled before release.
