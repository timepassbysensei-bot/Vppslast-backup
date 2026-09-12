# View Point Public School — Website & Staff Admin

A production‑ready, **bilingual (English / हिन्दी)** public website and a secure
staff/admin system for View Point Public School. One React application serves the
public site, the teacher dashboard, and the principal dashboard. All authorization
is enforced by **Postgres Row Level Security (RLS)** and **server‑side Netlify
Functions** — never by hiding routes in the browser.

> **Setting it up from a phone?** Follow the step‑by‑step
> **[Phone Setup Guide](docs/PHONE-SETUP-GUIDE.md)**. You do not need to write
> code or run any commands locally.

---

## Tech stack

- **Frontend:** React + TypeScript (strict), Vite, Tailwind CSS, React Router,
  React Hook Form + Zod, TanStack Query, i18next, react‑helmet‑async, Lucide icons,
  self‑hosted `@fontsource` fonts (no font CDN).
- **Backend:** Supabase (Postgres, Auth, Storage, RLS) + Netlify Functions
  (service‑role operations, Gemini, Resend, Turnstile, approvals, secure deletion,
  scheduled retention cleanup, signed private‑file URLs, principal bootstrap).
- **Bot protection:** Cloudflare Turnstile on anonymous forms.
- **Chatbot:** Gemini‑backed “Sensei”, with an approved‑FAQ fallback.

## Project structure

```
supabase/
  migrations/0001_schema.sql        schema, enums, helpers, triggers, seeds, RLS enablement
  migrations/0002_rls.sql           RLS policies + least‑privilege grants
  migrations/0003_storage.sql       storage buckets + storage policies
  migrations/0004_retention_cleanup.sql  expired‑batch readers + row deleters
  setup-all.sql                     one‑paste fresh setup (0001→0004, phone friendly)
  reset-DANGER.sql                  destructive reset (never run automatically)
netlify/functions/
  sensei-chat, submit-admission, submit-parent-message, approve-teacher,
  birthdays-today, signed-file, delete-content, retention-cleanup, bootstrap-principal
  shared/                           auth, cors, env, errors, guard, logging,
                                    rate-limit, storage, supabase, turnstile,
                                    validation, notify
src/
  routes/public/*                   all public pages
  routes/admin/*                    login, signup, pending, teacher, principal
  components/*                       UI kit, layout, forms, Sensei, dashboards
  hooks/*                            public/staff/principal data + mutations
  lib/*                             supabase client, functions client, time,
                                    content (bilingual), types, schemas, upload
  i18n/                            en.json / hi.json
scripts/prerender.mjs               per‑route SEO snapshots + sitemap + robots
styles/tokens.css                   design tokens
netlify.toml, .env.example
docs/                               PHONE-SETUP-GUIDE, FINAL-REPORT, EXPLAINER
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Type‑check, production build, prerender public routes |
| `npm run typecheck` | Strict TS for the app **and** the Netlify functions |
| `npm run lint` | ESLint (zero warnings allowed) |
| `npm run test` | Vitest unit tests |
| `npm run check` | typecheck + lint + test + build:app |

## Environment variables

Browser‑safe (compiled into the bundle — **not secret**):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, `VITE_TURNSTILE_SITE_KEY`.

Server‑only (Netlify Functions only — **never** exposed to the browser):
`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
`ADMIN_NOTIFICATION_EMAIL`, `ADMIN_BOOTSTRAP_EMAIL`, `TURNSTILE_SECRET_KEY`,
`CLEANUP_SECRET`, `BOOTSTRAP_SECRET`.

See [`.env.example`](.env.example) for the full list (names only).

## Security highlights

- RLS default‑deny on every table; public reads limited to published, non‑expired rows.
- Anonymous form submissions go **only** through Netlify Functions (Turnstile + Zod +
  rate limiting + service‑role insert) — no anonymous table inserts.
- Private files are served solely via short‑lived, row‑authorized signed URLs.
- Permanent deletion is coordinated server‑side against an allow‑list of content types;
  the browser can never point deletion at an arbitrary bucket/path.
- `audit_logs` is append‑only (enforced by a trigger, for every role).
- Strict CSP with **no** `unsafe-inline` / `unsafe-eval`.

## Retention (permanent deletion)

| Content | Auto‑deleted after | Also deletes |
| --- | --- | --- |
| Homework | 7 days | storage images, `homework_versions` |
| Class notices | 7 days | attachment |
| Leave requests | 5 days | attachment, `leave_decisions` |
| Internal teacher notices | 5 days | attachment, `internal_notice_reads` |

`expires_at` is forced by database triggers on insert; RLS hides rows the moment they
expire; a Netlify **Scheduled Function** (hourly) performs the physical, idempotent
permanent deletion.
