# 📱 Easy Phone Setup Guide — View Point Public School

This guide assumes you use an **Android phone**, you are a **beginner**, and you
**cannot** run code or `npm` locally. Everything here is done in a **web browser**
using GitHub, Supabase, Netlify, Cloudflare, Google AI Studio, and (optionally)
Resend.

Take it one step at a time. After each step there is a **✅ How to confirm it worked**
line and a **⚠️ If something goes wrong** tip.

---

## 0. What you will end up with

- A public website (home, notices, homework, gallery, admissions, contact, …).
- A private staff area at `/admin` for teachers and the principal.
- A database (Supabase) that stores everything, protected by strict security rules.

Keep two kinds of values apart in your mind:

- **Browser‑safe** values start with `VITE_`. They are baked into the website and are
  *not* secret.
- **Server‑only** values are **secret**. They go into Netlify only and must never be
  shared or put into `VITE_` variables.

---

## 1. Project download and folder structure

1. Open the GitHub repository for this project in your phone browser.
2. The important folders are:
   - `supabase/` — the database setup (`setup-all.sql` is the one you paste).
   - `netlify/functions/` — the secure server code.
   - `src/` — the website itself.
   - `docs/` — this guide and the final report.

✅ **Confirm:** you can see `supabase/setup-all.sql` in the repo.

---

## 2. Upload the complete project to GitHub (from a phone)

If the code is **already** in this GitHub repository, skip to Step 3.

If you received a ZIP instead:
1. Go to **github.com** → tap **＋** (top right) → **New repository**.
2. Name it (e.g. `vpps-website`), keep it **Private**, tap **Create repository**.
3. Tap **uploading an existing file** → **choose your files** → select the unzipped
   project files → **Commit changes**.

✅ **Confirm:** the repo shows `package.json`, `src/`, `supabase/`, `netlify/`.
⚠️ GitHub’s mobile upload can be fussy with many files — the Chrome “Desktop site”
option often helps.

---

## 3. Create the Supabase project

1. Open **supabase.com** → **Start your project** → sign in with GitHub.
2. **New project** → choose your organisation.
3. Give it a name, set a strong **database password** (save it somewhere safe),
   choose a region close to you (e.g. Mumbai), tap **Create new project**.
4. Wait ~2 minutes for it to finish provisioning.

✅ **Confirm:** you land on the project dashboard.

---

## 4. Find the Supabase project URL

1. Left sidebar → **Project Settings** (gear) → **API**.
2. Copy **Project URL** (looks like `https://abcdxyz.supabase.co`).

➡️ This is `VITE_SUPABASE_URL` (**browser‑safe**).

---

## 5. Find the Supabase anon key

1. Same page (**Project Settings → API**).
2. Under **Project API keys**, copy the **`anon` `public`** key.

➡️ This is `VITE_SUPABASE_ANON_KEY` (**browser‑safe**).

---

## 6. Find the service‑role key and keep it secret

1. Same page. Under **Project API keys**, reveal and copy the **`service_role`** key.

➡️ This is `SUPABASE_SERVICE_ROLE_KEY` (**SERVER‑ONLY, SECRET**).
⚠️ Never paste this into a `VITE_` variable, into the website, or into a chat. It can
read and change **everything**.

---

## 7. Run `supabase/setup-all.sql` in the SQL Editor

1. In the repo, open `supabase/setup-all.sql` and copy **all** of it.
2. In Supabase → left sidebar → **SQL Editor** → **New query**.
3. Paste everything → tap **Run**.

✅ **Confirm:** you see “Success. No rows returned” (some grey **NOTICE** lines are
normal and harmless).
⚠️ If you see a red error, read the first error only, fix that, and run again. The
script is safe to run more than once.

---

## 8. The separate `0001 → 0002 → 0003 → 0004` order (advanced/optional)

`setup-all.sql` already contains everything in the right order, so you normally do
**not** need this. If you prefer running migrations one at a time, run them in this
exact order, each in its own SQL Editor query:

1. `supabase/migrations/0001_schema.sql` — tables, helpers, triggers, seeds.
2. `supabase/migrations/0002_rls.sql` — security policies.
3. `supabase/migrations/0003_storage.sql` — file buckets + policies.
4. `supabase/migrations/0004_retention_cleanup.sql` — cleanup helpers.

Never run `0002` before `0001`, etc.

---

## 9. Verify tables, triggers, RLS, functions, seeds, and Storage buckets

1. **Table Editor** → you should see `profiles`, `user_roles`, `classes`, `sections`,
   `school_settings`, `homework_uploads`, `class_notices`, `public_notices`,
   `gallery_images`, `resources`, `parent_messages`, `admission_enquiries`,
   `teacher_leave_requests`, `internal_teacher_notices`, `birthday_profiles`,
   `student_spotlights`, `chatbot_faqs`, `audit_logs`, and more.
2. Open **`classes`** → you should see **Nursery** and **Class 1–10** (11 rows).
3. Open **`school_settings`** → exactly **1 row**, with the fee message and the 7
   confirmed facilities filled in, and most other fields blank (that is intentional).
4. **Storage** (left sidebar) → you should see buckets: `branding`, `notices`,
   `homework`, `gallery`, `spotlight`, `resources-public`, `birthday` (public) and
   `resources-private`, `parent-attachments`, `leave-attachments`, `internal-notices`
   (private).

✅ **Confirm:** the counts above match.

---

## 10. Enable the Email/Password provider

1. Supabase → **Authentication** → **Providers** → **Email**.
2. Make sure **Email** is **enabled**. Do **not** enable Google or any social login.

✅ **Confirm:** Email provider shows “Enabled”.

---

## 11. Disable email confirmation (recommended for this simple setup)

1. **Authentication** → **Providers** → **Email** → turn **Confirm email** **OFF**
   (or **Authentication → Sign In / Providers** depending on the current UI).
2. This means: **principal approval is the only gate** for staff access — which is
   exactly what we want.

✅ **Confirm:** new sign‑ups can log in immediately (but stay “pending” until the
principal approves them).

---

## 12. Deploy the GitHub repository through Netlify

1. Open **netlify.com** → **Log in** with GitHub.
2. **Add new site** → **Import an existing project** → **GitHub** → pick your repo.
3. Netlify reads `netlify.toml` automatically:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. Tap **Deploy site**. The **first** deploy may show a blank/broken site — that is
   expected until you add the environment variables (next step).

✅ **Confirm:** the deploy finishes (green “Published”).

---

## 13. Add every Netlify environment variable

Netlify → **Site configuration** → **Environment variables** → **Add a variable**
(add each of these):

| Variable | Browser‑safe or Server‑only | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Browser‑safe | from Step 4 |
| `VITE_SUPABASE_ANON_KEY` | Browser‑safe | from Step 5 |
| `VITE_SITE_URL` | Browser‑safe | your Netlify site URL, e.g. `https://your-site.netlify.app` |
| `VITE_TURNSTILE_SITE_KEY` | Browser‑safe | from Step 15 |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server‑only** | from Step 6 |
| `TURNSTILE_SECRET_KEY` | **Server‑only** | from Step 15 |
| `GEMINI_API_KEY` | **Server‑only** | from Step 16 (optional) |
| `RESEND_API_KEY` | **Server‑only** | from Step 17 (optional) |
| `RESEND_FROM_EMAIL` | **Server‑only** | e.g. `noreply@yourdomain` (optional) |
| `ADMIN_NOTIFICATION_EMAIL` | **Server‑only** | where form alerts go (optional) |
| `ADMIN_BOOTSTRAP_EMAIL` | **Server‑only** | `timepassbysensei@gmail.com` |
| `CLEANUP_SECRET` | **Server‑only** | any long random text you make up |
| `BOOTSTRAP_SECRET` | **Server‑only** | any long random text you make up |

**What each means / what happens if missing:**

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — the website’s connection to the
  database. **Missing → the site shows “not configured” and no data loads.**
- `VITE_SITE_URL` — your final web address; used for correct links, SEO canonical URLs
  and sitemap. **Missing → links/SEO fall back to relative paths.**
- `VITE_TURNSTILE_SITE_KEY` — shows the “I’m human” widget on forms. **Missing → the
  widget doesn’t appear and form submissions are refused by the server.**
- `SUPABASE_SERVICE_ROLE_KEY` — lets the secure server functions do their work.
  **Missing → approvals, deletions, forms, birthdays, cleanup all fail.**
- `TURNSTILE_SECRET_KEY` — server side of the human check. **Missing → forms return
  “form protection not configured”.**
- `GEMINI_API_KEY` — powers the Sensei chatbot. **Missing → Sensei still works using
  the FAQ fallback and quick links.**
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `ADMIN_NOTIFICATION_EMAIL` — optional email
  alerts for new form submissions. **Missing → submissions are still saved; just no
  email is sent.**
- `ADMIN_BOOTSTRAP_EMAIL` — the master principal’s email. **Missing → the one‑time
  bootstrap function refuses to run.**
- `CLEANUP_SECRET` — protects the cleanup function from outside triggering.
- `BOOTSTRAP_SECRET` — password for the one‑time principal bootstrap function.

---

## 14. Redeploy after adding variables

1. Netlify → **Deploys** → **Trigger deploy** → **Deploy site**.
2. Wait for “Published”.

✅ **Confirm:** open your site URL — the homepage now loads with the school name and
the confirmed facilities.

---

## 15. Configure Cloudflare Turnstile

1. Open **dash.cloudflare.com** → **Turnstile** → **Add site**.
2. Add your Netlify domain (and later your custom domain). Widget mode: **Managed**.
3. Copy the **Site Key** → this is `VITE_TURNSTILE_SITE_KEY` (**browser‑safe**).
4. Copy the **Secret Key** → this is `TURNSTILE_SECRET_KEY` (**server‑only**).
5. Put both into Netlify (Step 13) and **redeploy** (Step 14).

✅ **Confirm:** the admissions/contact forms show the Turnstile checkbox.

---

## 16. Configure Gemini (Sensei chatbot)

1. Open **aistudio.google.com** → **Get API key** → **Create API key**.
2. Copy it → this is `GEMINI_API_KEY` (**server‑only**) → add to Netlify → redeploy.

✅ **Confirm:** open the Sensei button (bottom‑right) and ask “What are the school
timings?”. Without this key Sensei still answers from FAQs.

---

## 17. Configure optional Resend email

1. Open **resend.com** → create an API key → copy it as `RESEND_API_KEY`
   (**server‑only**).
2. Set `RESEND_FROM_EMAIL` to a verified sender and `ADMIN_NOTIFICATION_EMAIL` to the
   inbox that should receive alerts. Add to Netlify → redeploy.

✅ **Confirm:** submitting the admission form results in an email (if configured).
Skipping this is fine — submissions are still saved in Supabase.

---

## 18. Sign up `timepassbysensei@gmail.com`

1. Open `https://your-site/admin/signup`.
2. Enter a display name, the email **`timepassbysensei@gmail.com`**, and a password.
3. Tap **Submit Registration**.

✅ **Confirm:** you are taken to the “Awaiting Approval” screen, and in Supabase →
**Table Editor → user_roles** the row shows `role = teacher`, `status = pending`.

---

## 19. Bootstrap the master principal securely

Pick **ONE** of these two methods.

**Method A — one‑time SQL (simplest on a phone):** Supabase → **SQL Editor** → run:

```sql
update public.user_roles ur
set role = 'principal',
    status = 'approved',
    approved_at = now(),
    approved_by = u.id
from auth.users u
where u.id = ur.user_id
  and lower(u.email) = lower('timepassbysensei@gmail.com');
```

**Method B — the protected function:** call your bootstrap function with the secret
you set:

```
POST https://your-site/.netlify/functions/bootstrap-principal
Content-Type: application/json

{ "secret": "the BOOTSTRAP_SECRET you set in Netlify" }
```

✅ **Confirm:** in `user_roles`, `timepassbysensei@gmail.com` now has
`role = principal`, `status = approved`. Log in and you should land on
`/admin/principal`.

---

## 20. Disable / remove bootstrap access after success

Once the principal exists, close the door:

1. Netlify → **Environment variables** → delete `BOOTSTRAP_SECRET` (and optionally
   `ADMIN_BOOTSTRAP_EMAIL`) → redeploy. With no secret configured, the bootstrap
   function refuses every request.

✅ **Confirm:** calling the bootstrap function now returns “not configured”.

---

## 21. Verify the scheduled permanent cleanup

The retention cleanup runs automatically **every hour** (configured in
`netlify.toml`). To check:

1. Netlify → **Functions** → `retention-cleanup` → view recent invocations/logs.

✅ **Confirm:** you see periodic runs. Expired homework/class‑notices (7 days) and
leave/internal‑notices (5 days) are permanently deleted along with their files.

---

## 22. Upload branding and gallery media through the dashboard

Log in as the principal → `/admin/principal`:

- **Gallery Manager** → upload public photos.
- **Branding** (logo, favicon, hero, principal photo, about photo, OG image) — upload
  through Supabase **Storage → `branding`** bucket, then set the matching row in the
  **`branding_assets`** table (`path` and `public_url`). Recommended sizes below.

Recommended formats/sizes:

- Logo: transparent PNG/WebP ~512×512.
- Favicon: square PNG ~192×192 or 512×512.
- Hero: WebP/optimised JPEG ~1600×900.
- Gallery: WebP/optimised JPEG ~1200–1600 px wide.
- Student photos: portrait WebP/JPEG ~800×1000.
- Keep files compressed and under the bucket’s size limit (5 MB images / 10 MB PDFs).

---

## 23. Add the final domain later

1. Netlify → **Domain management** → **Add a custom domain** → follow the DNS steps.

---

## 24. Update URLs after adding the domain

1. Netlify env: set `VITE_SITE_URL` to your final `https://…` domain → redeploy.
2. Supabase → **Authentication → URL Configuration** → set **Site URL** and add your
   domain to **Redirect URLs**.
3. Cloudflare Turnstile → add the new domain to your Turnstile site.

✅ **Confirm:** the site loads on your custom domain, forms still show Turnstile, and
login still works.

---

## 25. Final testing checklist

- [ ] Home page shows the school name, today’s timings (Asia/Kolkata), facilities.
- [ ] Switch **EN/हिन्दी** — the preference is remembered.
- [ ] Notices / Class page / Homework show published content; empty states otherwise.
- [ ] Admissions & Contact forms submit (Turnstile visible) and appear for the
      principal only.
- [ ] Sign up a test teacher → principal **approves** them → they can post homework.
- [ ] Principal **suspends** the teacher → the teacher immediately loses access.
- [ ] A teacher can delete **their own** homework; not another teacher’s.
- [ ] Sensei answers general questions and never reveals private data.
- [ ] Birthdays page/home never shows a date of birth or age.

---

### Where to change settings later (no code needed)

Everything school‑specific — name, tagline, address, phone, email, principal’s
message, affiliation number, admission open/closed, social links, facilities, timings,
emergency alert, gallery, resources, chatbot FAQs — is edited from the **Principal
Dashboard**. Unknown facts are intentionally left blank until you confirm them.
