# Final Report — View Point Public School build

This report is **truthful about what was actually executed**. Where an integration
could not be exercised without live third‑party keys, it is marked
**“configuration‑dependent — not executed”** rather than claimed as passing.

---

## 1. Features completed

**Public website:** all required routes (`/`, `/about`, `/academics`, `/notices`,
`/class-notices`, `/homework`, `/calendar`, `/achievements`, `/birthdays`, `/gallery`,
`/resources`, `/admissions`, `/contact`, `/privacy`, `/terms`, `/accessibility`).
Homepage sections follow the specified order (emergency alert, hero, name/tagline,
CTAs, quick links, notice preview, today’s timings in Asia/Kolkata, today’s birthday,
Student of the Month, upcoming events, gallery preview, facilities, principal’s
message, contact — no WhatsApp). Combined class view shows homework + class notices.
Bilingual EN/HI with localStorage preference and “Hindi translation not available”
fallback. Accessible header/footer, focus‑trapped mobile menu, Sensei widget.

**Auth & routing:** email/password only; `/admin/signup`, `/admin/login`,
`/admin/pending`, `/admin/teacher`, `/admin/principal`; live status routing; guards
that wait for the session/role check before rendering.

**Teacher dashboard:** homework quick uploader (0–2 images, camera capture, random safe
filenames), recent homework with permanent delete (own), class notices (create/edit/
delete own), principal notice board (read + mark read + signed attachments), leave
center (submit/cancel/delete own + decision note), birthday management (create/publish
mode/delete), Student of the Month (create/publish‑current/delete).

**Principal dashboard:** pending approvals, staff roster + dismiss, internal notices,
public notices (bilingual, publish/pin/urgent/expiry), all class notices, all homework,
leave inbox (approve/reject + private note), timing manager, emergency alert, school
settings & facilities, gallery manager, resources manager (public/private), parent
messages, admission enquiries, calendar, achievements, chatbot FAQs, audit viewer.

**Backend:** 9 Netlify Functions + 12 shared utilities; Supabase schema, RLS, storage,
retention cleanup; Sensei with Gemini + FAQ fallback and prompt‑injection defenses.

## 2. Files created

See the repository tree in `README.md`. Highlights: 5 SQL files + 1 destructive reset,
9 functions + shared utilities, ~60 frontend source files, i18n EN/HI, tests, prerender
script, `netlify.toml`, `.env.example`, and docs.

## 3. Database migrations created

`supabase/migrations/0001_schema.sql`, `0002_rls.sql`, `0003_storage.sql`,
`0004_retention_cleanup.sql`, plus `supabase/setup-all.sql` (one‑paste) and
`supabase/reset-DANGER.sql` (never run automatically).

## 4. Netlify Functions created

`sensei-chat`, `submit-admission`, `submit-parent-message`, `approve-teacher`,
`birthdays-today`, `signed-file`, `delete-content`, `retention-cleanup`,
`bootstrap-principal`, plus `shared/`: `auth`, `cors`, `env`, `errors`, `guard`,
`logging`, `rate-limit`, `storage`, `supabase`, `turnstile`, `validation`, `notify`.

## 5. Tests and checks actually run — and 6. exact results

Executed in this environment (Node 22, Postgres 16):

| Check | Command | Result |
| --- | --- | --- |
| TypeScript (app, strict) | `tsc -b` | ✅ pass (0 errors) |
| TypeScript (functions, strict) | `tsc -p netlify/tsconfig.json` | ✅ pass (0 errors) |
| Lint | `eslint . --max-warnings 0` | ✅ pass (0 warnings) |
| Unit tests | `vitest run` | ✅ **32 passed** / 6 files |
| Production build | `npm run build` | ✅ pass (+ prerender: 16 route snapshots, sitemap.xml, robots.txt) |
| Secret scan of built bundle | grep `dist/` | ✅ none of the server‑only names/keys present |
| CSP token scan of bundle | grep `dist/` | ✅ no `unsafe-inline` / `unsafe-eval` |
| No TODO/stub/pseudocode | grep source | ✅ none found |

**Database validated on real PostgreSQL 16** (a throwaway cluster + a minimal Supabase
`auth`/`storage`/roles shim; `setup-all.sql` applied with `ON_ERROR_STOP`):

| Area | Result |
| --- | --- |
| `setup-all.sql` load | ✅ completes (only expected idempotency NOTICEs) |
| Seeds | ✅ 11 classes, 20 sections, 1 settings row (7 facilities), 4 timings, 7 branding slots, 1 chatbot |
| Signup trigger | ✅ inserting an `auth.users` row creates `profiles` + `user_roles(teacher, pending)` |
| Retention triggers | ✅ homework/class‑notice = +7 days, leave/internal = +5 days; client‑supplied `expires_at` is overridden |
| Audit immutability | ✅ INSERT allowed; UPDATE and DELETE raise errors for every role |
| RLS — anon | ✅ reads public settings; `parent_messages`, `birthday_profiles`, `audit_logs` return 0 rows |
| RLS — approved teacher | ✅ sees only own birthdays; denied parent messages/audit; can insert own homework; **RLS error** when `created_by` is another user; self‑promotion UPDATE is a no‑op (stays `teacher`) |
| RLS — approved principal | ✅ reads parent messages, all birthdays, audit logs |
| Expiry exclusion | ✅ an aged row is hidden from anon immediately (before physical cleanup) |
| Storage policies | ✅ teacher upload allowed only in own folder; denied in another user’s folder and in principal‑only `gallery` |
| `set_current_spotlight` | ✅ atomic swap; single‑current invariant holds |
| Retention cleanup RPCs | ✅ `list_expired_*` finds aged rows; `delete_*_rows` deletes them; cascade removes `homework_versions`; re‑running is idempotent (returns 0) |

## 7. Configuration‑dependent checks — not executed

These require live third‑party credentials or a browser deployment and were **not**
run here (do not treat as verified):

- **Live Cloudflare Turnstile** verification (needs real site/secret keys).
- **Live Gemini** chat responses (needs `GEMINI_API_KEY`).
- **Live Resend** email delivery (needs `RESEND_API_KEY`).
- **Netlify Scheduled Function** real hourly invocation (validated logically + the RPCs
  it calls were tested against Postgres, but not run on Netlify’s scheduler here).
- **End‑to‑end browser UI run** against a live Supabase project (build + unit tests pass;
  no headless‑browser E2E/screenshots were produced in this environment).
- **Supabase Auth sign‑up over HTTP** (the DB‑side effect — the signup trigger — was
  validated by inserting into `auth.users`).

## 8. Safe defaults chosen

- **No Radix dependency**; custom accessible dialog/menu so the strict CSP can forbid
  `unsafe-inline`/`unsafe-eval`.
- **Prerender = meta‑only** per‑route snapshots (title/description/canonical/OG) +
  sitemap + robots — no headless browser, no credentials at build time.
- **Retention cleanup schedule = hourly** (`@hourly` in `netlify.toml`) to minimise the
  window between `expires_at` and physical deletion (RLS already hides expired rows).
- **Turnstile fails closed:** if the secret is unset, anonymous form functions return
  “not configured” rather than accepting unverified input. Sensei treats Turnstile as
  optional (rate‑limited) so the chatbot still works before Turnstile is configured.
- **Deletions are server‑only** via the allow‑listed `delete-content` function; the
  browser has no DELETE privilege on content tables.
- **`Cross-Origin-Resource-Policy: same-origin`** (Supabase images load fine because
  COEP is not set).
- Chatbot FAQ “delete” is an **is_active** toggle (FAQs are not in the permanent‑
  retention set), so no hard delete path is exposed for them.

## 9. Known limitations

- The main JS bundle is ~765 KB (≈213 KB gzip). It builds fine; route‑level code
  splitting could reduce it but was not applied to keep the delivery simple.
- In‑memory per‑IP rate limiting in functions is **best‑effort** (serverless instances
  are ephemeral); a durable store (e.g. Upstash) is recommended for strict limits.
- Parent‑attachment uploads are not exposed in the anonymous form UI (the table,
  private bucket, and principal‑only signed‑file path exist for future use).
- No live browser E2E was executed here (see §7).

## 10. Configuration still required (you must supply)

`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`,
`VITE_TURNSTILE_SITE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`,
`GEMINI_API_KEY` (optional), `RESEND_API_KEY` / `RESEND_FROM_EMAIL` /
`ADMIN_NOTIFICATION_EMAIL` (optional), `ADMIN_BOOTSTRAP_EMAIL`
(`timepassbysensei@gmail.com`), `CLEANUP_SECRET`, `BOOTSTRAP_SECRET`, and the final
website domain. See the [Phone Setup Guide](PHONE-SETUP-GUIDE.md).

## 11. School information still awaiting confirmation (left blank by design)

CBSE **affiliation number**; final **domain**; the principal’s **confirmed name**;
the principal’s **approved message**; approved **logo and school photographs**;
approved **student photographs**; **social‑media links**; fees (only the approved
contact‑the‑office message is shown, never a number); awards/results/testimonials/
statistics; and any other unverified school fact. All of these are editable, initially
blank settings — nothing has been fabricated.
