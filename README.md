# Elite Courts — website and admin portal

Production Next.js App Router website for Elite Courts, Lahore, with a full
admin portal. Supabase holds the application data, Cloudinary holds newly
uploaded media. Production uses authoritative Supabase content; bundled snapshots
are available for local previews and intentional hybrid fallback.

**Live site:** https://elitecourts.com.pk

## Source cleanup

Generated PDFs, screenshots, old logs and the QA cache have been archived outside
this project. Redundant upgrade scripts were removed after verifying their
content is covered by the [main migrations](supabase/migrations/README.md).
See [the cleanup record](docs/source-cleanup.md) for what was removed and why
normal dependency/build folders are still present.

## Current release

Verify the installed database against the consolidated 01–25 schema and complete private receipt setup before opening checkout. Hosting
and retention periods are still undecided. See [the deployment guide](docs/production-deployment-guide.md)
and [the release report](docs/production-update-report.md). Quantity tracking is disabled,
MFA is mandatory, and failed order emails are retried manually in Orders.

## Start here

| If you want to…                                          | Read                                                   |
| -------------------------------------------------------- | ------------------------------------------------------ |
| Deploy, configure or verify the site                     | [Production setup](docs/production-setup.md)            |
| Run the business day to day from `/admin`                | [Admin portal guide](docs/admin-portal-guide.md)        |
| Apply the database                                       | [Database runbook](supabase/README.md)                  |
| Create an administrator, or limit one                    | [Administrator bootstrap](docs/admin-bootstrap-guide.md) |
| Understand the tables                                    | [Database guide](docs/database-schema.md)               |
| Know what was hardened, and what is still open           | [Security review](docs/security-review.md)              |
| Understand the SEO work, the AMP decision, the competitors | [SEO and performance](docs/seo-and-performance.md)    |

## Quick start

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` first. For an offline preview, choose CONTENT_SOURCE=local. The portal test mode
must be explicitly enabled for local development and is disabled in production.

```bash
npm run verify   # lint, typecheck, tests, production build
```

## Tech stack

Next.js App Router · React · TypeScript · Tailwind CSS v4 · Supabase
(PostgreSQL, Auth, realtime) · Cloudinary · Motion · Zod · Nodemailer ·
Vitest · Playwright

**Typography.** Self-hosted Manrope for interface text and Sora for display
headings, with system fallbacks and no runtime Google Fonts dependency.

## How content reaches the page

`CONTENT_SOURCE` decides where the public website reads from. It is
deliberately authoritative — the application never silently overrides it.

| Mode                  | Behaviour                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `local`               | Bundled content only. Supabase is never contacted.                                                                     |
| `supabase`            | Supabase only. If a section is not installed, or is installed but empty, that section renders empty. Bundled content is never substituted. A genuine outage shows a controlled unavailable page. Missing or invalid public configuration also shows unavailable instead of bundled settings. |
| `hybrid` *(optional)* | Supabase → the last good in-process response → bundled content.                                                     |

Editing in the portal always requires Supabase and never writes to the bundled
files.

In strict `supabase` mode, a section whose required table has not been applied
shows its empty state rather than bundled data. That is the contract, not a bug.

## What is where

```
app/                    Routes. app/admin is the portal; everything else is public.
components/             UI. Grouped by area: admin, layout, store, tournaments, menu, theme.
lib/
  admin/                Authentication, roles and permissions, resource registry
  content/              provider.ts (Supabase + fallback), local.ts (bundled), types.ts
  store/                Receipt checks, stock rules, order emails
  seo/                  Structured data builders
  settings.ts           Typed reader for Admin → Configuration
  tournament-presentation.ts  Standings, leaderboards, brackets, registration state
data/                   Bundled fallback content and setting defaults
supabase/migrations/    The one authoritative schema and seed sequence
scripts/                Admin bootstrap, database rebuild, seed generators
docs/                   The guides listed above
tests/                  Vitest
```

## Where to edit content

**Once Supabase is connected, edit content in `/admin`, not in these files.**
They are the bundled fallback used by `local` and `hybrid` mode.

| File                       | Holds                                                        |
| -------------------------- | ------------------------------------------------------------ |
| `data/siteContent.ts`      | Business details, navigation, SEO copy, page text, legal text |
| `data/packagePrices.ts`    | Package price constants                                      |
| `data/packages.ts`         | Package details, inclusions, badges, sections                |
| `data/menu.ts`             | The Cafe menu and source of migration 25's seed               |
| `data/faqs.ts`             | Common questions                                             |
| `data/sliderImages.ts`     | Homepage hero slides                                         |
| `data/videos.ts`           | Highlights                                                   |
| `data/settingDefaults.ts`  | Fallback values for every setting in Configuration           |

### The Cafe menu is generated into SQL

`data/menu.ts` is the single source. After editing it:

```bash
npm run db:menu:generate   # rewrites supabase/migrations/25_food_menu_seed.sql
```

The generated seed refreshes names, descriptions and images on a re-run, but
never overwrites a price or an image an administrator has changed in the portal.

## The admin portal

`/admin`. Grouped, permission-aware navigation:

- **Overview** — dashboard, with alerts for orders awaiting a payment check and
  products running low
- **Website content** — hero, sports, packages, memberships, highlights,
  amenities
- **Messages** — announcements, website notices, common questions
- **Cafe menu** — menu items and sections
- **Elite Store** — orders, products, payment accounts
- **Competitions** — tournaments
- **Appearance** — card effects, social profiles
- **System** — my account, activity log, configuration, administrators

Three roles: **owner**, **manager**, **editor**. Every existing account is an
owner, so nothing changed when roles were introduced. Permissions are enforced
on the server on every request — hiding a sidebar link is a convenience, not a
control.

Every form field has a question-mark icon; hover it for a plain explanation and
a real example value.

## Tournaments

One model covers the historical Elite Courts events and every future format:

| Format             | What the page shows                                                    |
| ------------------ | ---------------------------------------------------------------------- |
| `group_knockout`   | Group points tables feeding a knockout bracket                          |
| `round_robin`      | A single combined points table                                          |
| `knockout`         | A bracket only                                                          |
| `americano`        | A **player** leaderboard — partners change, points are individual       |
| `mexicano`         | The same, with pairings driven by the standings                          |
| `custom`           | Whatever the named rounds describe                                       |

Standings are always calculated from completed fixtures using the points values
set on that tournament — never typed by hand. A completed tournament gains a
Presentation Ceremony section built from its awards.

Migration 21 loads the four historical tournaments, including their champions
and presentation photographs.

## Elite Store

There is no payment gateway. A customer transfers money, uploads a receipt, and
a person verifies it.

Checkout collects details, offers full or advance payment where enabled, shows
the payment accounts an administrator has configured, takes a receipt upload, and
recalculates every total on the server — nothing about money is trusted from the
browser. Stock is reserved atomically, and returned if the order is cancelled.

The portal shows each order with its receipt image, an automated receipt score,
locally processed OCR clues, and the status workflow. Emails go out at each step, with an "inform the
customer" checkbox that is ticked by default and disabled when email is not
configured.

**The automated receipt score is guidance, never proof.** It cannot know whether
money arrived; the transfer must be confirmed in the bank account.

## Dark mode

Dark mode carries a quiet animated starfield with an occasional shooting star.
Hand-written canvas, roughly 250 lines: stars are blitted from an offscreen
layer, the loop is throttled to about 24fps and stops when the tab is hidden,
device pixel ratio is capped at 1.5, and `prefers-reduced-motion` draws one
static frame with no movement at all. It can be switched off in Configuration.

## Colour

The palette follows a 60-30-10 split, documented at the top of
`app/globals.css`: 60% page ground, 30% navy-toned surfaces and text, and 10%
crest blue for interaction. Crest green marks wins, success and small highlight
details. Status colours sit outside the
ratio because they carry meaning rather than style.

## Environment

Every value is documented in `.env.example`. The ones that matter most:

| Variable                                                                    | Purpose                                                                 |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `CONTENT_SOURCE`                                                            | `local`, `supabase` or `hybrid`. The selected mode controls fallback; use `supabase` for database-only public content and settings. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`                 | Safe public project values                                              |
| `SUPABASE_SECRET_KEY`                                                       | Server-only. Powers the portal and checkout.                            |
| `CRON_SECRET`                                                              | Server-only Bearer token protecting both scheduled endpoints.           |
| `CLOUDINARY_*`                                                              | Signed uploads. The secret never reaches the browser.                   |
| `ADMIN_SESSION_COOKIE_SECRET`, `ADMIN_AUTH_RATE_LIMIT_PEPPER`, `ADMIN_TEMP_CREDENTIAL_PEPPER` | Three **different** random values, 32+ characters each |
| `RESEND_API_KEY` or `SMTP_*`                                                | Required for contact, security and order emails                         |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`                                             | GA4. Leave empty to disable analytics cleanly.                          |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`                                      | Optional Google Search Console verification token.                     |

The Vercel schedule calls `/api/cron/supabase-keepalive` once per day and
`/api/cron/pending-order-digest` at 9:00 AM Pakistan time (04:00 UTC). The
digest emails the configured order recipients only when active orders need
attention. Add a separate random `CRON_SECRET` of at least 32 characters in the
Vercel project settings; Vercel sends it automatically in the Authorization
header. The keep-alive endpoint performs one read-only Supabase query and
returns no database data.

## Timezone

Pakistan Standard Time (`Asia/Karachi`, UTC+05:00) is the business timezone for
the whole application. Dates entered in the admin portal are interpreted as
Pakistan time; tournament times, order references, security notices, activity
logs and reminder emails are displayed or grouped in Pakistan time. Supabase
continues to store `timestamptz` values as absolute instants, which avoids
changing or corrupting existing records. Vercel cron expressions are UTC, so
the 9:00 AM Pakistan order reminder is scheduled as `0 4 * * *`.

## Scripts

```bash
npm run dev                 # development server
npm run build / start       # production build and run
npm run lint                # ESLint, zero warnings allowed
npm run typecheck           # tsc --noEmit
npm run test                # Vitest
npm run verify              # all four, in order
npm run admin:bootstrap:production # create a production administrator
npm run db:install         # install and verify a new empty database
npm run db:rebuild          # reset and apply everything — never on production
npm run db:menu:generate    # regenerate the Cafe menu SQL seed from data/menu.ts
npm run db:content-seeds:generate # regenerate current content seeds
```

## Before deploying

Run `npm run verify`, then work through
[the verification checklist](docs/production-deployment-guide.md#release-checklist).
It covers the admin flows, the order and email flow, the three content modes,
permissions, tournaments, the Cafe menu, mobile layouts and reduced motion.

Use Node.js 24 LTS. Apply migrations and secrets to staging first,
complete the checklist there, then promote that exact build.
