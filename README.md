# Serhatech

The website of **Serhatech** ([serha.tech](https://serha.tech)), the software and systems studio founded by Serhat Kucı. It presents the studio's services, selected work and way of working, and gives clients a direct way to start a project, in Turkish and English.

The design concept is **Holo Atölye**: a bright engineering workshop whose lights dim for the big moments. At its centre, the WebGL **Serhatech Core**, six service modules around a reactor, changes with the scroll through three scenes: assembly (hero), exploded view (services) and architecture scan (selected work).

## Tech stack

- **Next.js 16** (App Router, Cache Components) with **React 19** and **TypeScript**
- **Three.js** for the single WebGL scene; **GSAP** with ScrollTrigger and SplitText for scroll choreography; **Motion** for small interface responses
- **Zod** for validation, **libphonenumber-js** for phone numbers
- **Resend** for contact email and **Upstash Redis** for rate limiting
- **Vitest** for unit tests, **Playwright** with **axe-core** for browser and accessibility tests
- **pnpm** as the package manager

## Getting started

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The site runs at http://localhost:3000. Turkish pages live at the root (`/`, `/hizmetler`, `/calismalar`, `/iletisim`), English pages under `/en` (`/en/services`, `/en/work`, `/en/contact`).

To open the dev server from a phone on the same network, use the computer's local address, for example `http://192.168.1.4:3000`. `next.config.ts` allows `192.168.*.*` origins in development; without that, Next.js blocks the scripts and the page never becomes interactive.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | Generate route types and run `tsc` |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | Browser tests (Playwright) |

## Testing

Unit tests cover the contact endpoint (validation, spam checks, rate limiting, the email Resend receives), phone and email rules, routing and SEO.

Browser tests run against a production build kept in `.next-e2e`, so a preview build in `.next` is never overwritten:

```sh
NEXT_DIST_DIR=.next-e2e pnpm build
NEXT_DIST_DIR=.next-e2e pnpm test:e2e
```

- Tests start the server on port 3100 using the system Chrome, headless. If something else already uses that port, Playwright reuses it as if it were this site; choose another port with `PW_PORT=3150`.
- The `chrome-mobile-scroll` project (pinned scenes, card order, scroll smoothness on phones) runs after the main `chrome` project.
- For the iOS engine: `pnpm exec playwright install webkit`, then run with `PW_WEBKIT=1`.
- Email providers are mocked; tests never send real email.

## Configuration

Copy `.env.example` to `.env.local` and fill it in. `.env.local` stays out of version control. Never put secrets in `NEXT_PUBLIC_` variables.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_COMPANY_NAME` | Public brand name (`Serhatech`) |
| `NEXT_PUBLIC_SITE_URL` | Production URL, `https://serha.tech`; empty for local previews |
| `SITE_INDEXING_ENABLED` | `true` only when the site may be indexed; until then pages are `noindex` and the sitemap is empty |
| `COMPANY_LEGAL_NAME` | Registered legal name (read into `site.legalName`; not shown on any page yet) |
| `LEGAL_CONTENT_APPROVED` | `true` only after the draft privacy and KVKK pages are replaced with approved text |
| `NEXT_PUBLIC_GITHUB_URL`, `NEXT_PUBLIC_LINKEDIN_URL` | Optional profile links (read into `site.social`; not shown on any page yet) |
| `CONTACT_FORM_ENABLED` | Send switch; defaults to `false`, set to `true` for live delivery after verification |
| `RESEND_API_KEY` | Resend API key restricted to sending from `notify.serha.tech` |
| `CONTACT_FROM_EMAIL` | Sender: `SERHATECH Form <form@notify.serha.tech>` after domain verification |
| `CONTACT_TO_EMAIL` | Required fixed recipient: `serhatvader@gmail.com`; public address stays `iletisim@serha.tech` |
| `CONTACT_SITE_URL` | Optional explicit origin accepted by the form; defaults to `NEXT_PUBLIC_SITE_URL` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Dedicated European Redis database for rate limiting; HTTPS `*.upstash.io` endpoint and secret token |
| `RATE_LIMIT_SECRET` | At least 32 characters; hashes visitor IPs |
| `TRUSTED_IP_HEADER` | `X-Real-IP`, overwritten by Caddy; Cloudflare visitor headers are accepted only from Cloudflare network peers |

Two checks report what is still missing, without sending anything:

```sh
node --env-file=.env.local scripts/check-contact.mjs
node --env-file=.env.local scripts/check-release.mjs
```

## Contact form

The form posts to `/api/contact`. The server validates the request (origin, size, Zod schema), drops spam (honeypot field, submissions that come too fast or too late), applies a rate limit (5 per visitor and 50 overall every 10 minutes) and sends the request with Resend.

Fields: name, email, optional phone with a "call me back" option, optional company, the topic in the visitor's own words, a message and when they would like to start. The phone field has a calling-code picker (Türkiye by default), caps the digits at the selected country's longest mobile or landline number, groups them as they are typed and sends the number in E.164.

The email arrives at `CONTACT_TO_EMAIL` from `CONTACT_FROM_EMAIL`, with **Reply-To** set to the visitor, so replying writes straight back to them:

- Subject `Yeni proje talebi: {topic}`, or `Arama talebi – Yeni proje talebi: {topic}` when a call back is requested
- A table with name, company, email, phone (a tap-to-call link), call back, topic and start, followed by the message
- A `callback=yes|no` tag in Resend

Sending requires `CONTACT_FORM_ENABLED=true` and valid Resend, Redis and proxy configuration. Placeholder keys, a test sender and invalid service URLs are rejected. Redis failure prevents sending. A timeout after contacting Resend is reported as unconfirmed and keeps the form contents. Retries of unchanged content use the same submission ID; edited content gets a new ID. Resend deduplicates the same ID and payload for 24 hours. IDs live in the current page; reloading starts a new submission. Acceptance confirms that Resend accepted the email, not that Gmail received it.

The public email address can always be used directly or copied. See [the deployment and Gmail acceptance checklist](deploy/contact-runbook.md) and [the site-specific Caddy blocks](deploy/Caddyfile.serha.tech).

## Project structure

```
src/
  app/[locale]/       Root layout and catch-all route for every page, per language
  views/              Server page templates (services, work, about, process, contact)
  components/
    home/             Home page sections and home-choreography.tsx (scroll → scene)
    lab/              The WebGL scene: engine/ (geometry, materials), director/
                      (scroll targets, damped follow, sticky stage tracker), loader
    svg/              Module glyphs and architecture diagrams, also the fallback
                      when WebGL or motion is unavailable
  content/            Typed content: studio.ts (Turkish), english.ts, architectures.ts
  config/site.ts      Company, founder, domain, contact, social links, portrait
  i18n/               Turkish/English routes and page metadata
  lib/                Contact form (schema, server, phone), motion tokens, SEO
  styles/             tokens.css, base.css, chrome.css, home.css, lab.css, pages.css
tests/                unit/ (Vitest) and e2e/ (Playwright)
design/brand/         Master logo files
scripts/              Brand asset builder, readiness checks, screenshot helpers
```

### Motion

- The WebGL scene loads only when the device can run it well, after the page has loaded. Without WebGL, or with reduced motion, the same information is shown as static SVG drawings.
- Scenes pin with CSS `position: sticky`; nothing hijacks the scroll. On phones the navbar steps aside while a scene is pinned.
- GSAP drives the scenes and scroll choreography; Motion handles buttons, the mobile menu and form states.
- The "Reduce motion" switch in the footer saves the visitor's choice; the system `prefers-reduced-motion` setting is respected too.

## Updating content

- **Services and projects:** Turkish in `src/content/studio.ts`, English in `src/content/english.ts`. The English arrays follow the Turkish order. When adding a service or project, also add its slugs to `src/i18n/routing.ts`.
- **Project architecture:** nodes and edges in `src/content/architectures.ts`. List only components the project really has.
- **Project screenshots:** add the file under `public/projects/` and set the project's `image` field, e.g. `{ src: '/projects/file.webp', alt: 'What the screen shows' }`. While `image` is `null`, a clearly labelled architecture drawing is shown instead.
- **GitHub and demo links:** shown only when a real URL is provided.
- **Founder portrait:** set `site.portrait` in `src/config/site.ts`; until then a typographic profile is used.
- **Logo and favicons:** replace the masters in `design/brand/` (`logo_dark.png` for light surfaces, `logo_light.png` for dark ones) and run `python scripts/build-brand.py` to regenerate the sizes in `public/`.

The language is decided by the URL only; there are no language cookies or automatic redirects. The `EN` / `TR` switch in the header goes to the same page in the other language.

## SEO

Each page has its own `lang`, title, description, Open Graph data and share image. With `NEXT_PUBLIC_SITE_URL` set, pages get canonical URLs, `tr` / `en` hreflang links and `x-default`. Structured data describes the organization and the founder. Indexing stays off, and the sitemap stays empty, until `SITE_INDEXING_ENABLED=true`.

## Before going live

- Verify the sending subdomain `notify.serha.tech` in Resend (SPF/DKIM), preserve root MX and forwarding, then set the Resend, Redis and `TRUSTED_IP_HEADER` values; verify Gmail delivery before leaving the send switch enabled. DMARC is recommended separately and does not gate contact delivery.
- Set `NEXT_PUBLIC_SITE_URL=https://serha.tech` and `COMPANY_LEGAL_NAME`
- Replace the draft privacy and KVKK pages with approved legal text, then set `LEGAL_CONTENT_APPROVED=true`
- Add the founder portrait and real project screenshots
- Turn on `SITE_INDEXING_ENABLED` and check links and real-device performance on the live site
