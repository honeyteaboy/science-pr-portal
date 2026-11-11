# Science PR Portal — Supabase setup

This folder contains the production database schema, server-side announcement APIs, scheduled publishing logic, and the email delivery worker for the existing Next.js/Vercel website.

## 1) Create a Supabase project

Create a Supabase project, then copy the Project URL and Publishable key from Project Settings → API.

## 2) Apply the database migration

Open Supabase Dashboard → SQL Editor and run the full migration:

`migrations/202611110001_initial_pr_portal.sql`

The migration creates:
- Profiles and role assignments
- Cohorts and topics
- Verified student cohort memberships
- Announcements and multiple HTTPS links
- Review checklist records and audit history
- Student preferences and email consent records
- Notification outbox
- RLS policies and secure RPCs for draft creation/editing, review, queuing, instant publishing, suspension, and scheduled publishing

The migration schedules the database publisher every minute if `pg_cron` is available. Check Supabase Dashboard → Integrations → Cron for the job named `science-pr-publish-due-announcements`. Minute scheduling means the automatic publish can occur up to about one minute after the exact 10-minute mark.

## 3) Configure Vercel

Add these environment variables to the existing Vercel project for Production, Preview, and Development as required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not put a service-role key in a `NEXT_PUBLIC_` variable. Do not paste secrets into source files, GitHub, or chat.

## 4) Configure Auth and Google OAuth

In Supabase Authentication → URL Configuration, set the Site URL to:

`https://science-pr-portal.vercel.app`

Add Redirect URLs:

- `https://science-pr-portal.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback`

For Google OAuth, configure the Google provider in Supabase Authentication → Providers → Google, and add the Supabase callback URL shown in the provider setup to Google's Authorized redirect URIs.

The public announcement homepage and published announcement detail pages can be read without signing in. Students can create an account with email and password; Supabase email confirmation should be enabled. Student accounts receive the `student` role automatically and can later choose topics and email notifications in `/profile`. Staff can sign in with email/password or Google OAuth. Staff accounts must be created by a trusted administrator and assigned `admin`, `reviewer`, or `superadmin` in the database before they can use the admin console. The Google flow requests only `openid email profile`; it does not request Gmail inbox or Gmail sending scopes.

## 5) Assign trusted staff roles

Every new email/password registration or Google sign-in is assigned the `student` role by default. A trusted administrator must verify staff identity and promote the profile in Supabase SQL Editor. Example:

```sql
update public.profiles
set role = 'admin'
where email = 'secretary@example.ac.th';

update public.profiles
set role = 'reviewer'
where email = 'reviewer@example.ac.th';

update public.profiles
set role = 'superadmin'
where email = 'system-owner@example.ac.th';
```

Replace example addresses only with verified institutional accounts. Users cannot grant roles to themselves through OAuth metadata.

## 6) Verify student cohort membership

Student feed targeting uses `student_cohort_memberships` rows with a non-null `verified_at`. Students cannot self-verify their cohort. Import or assign the official roster through a trusted administrator before relying on cohort-targeted news or email.

Example:

```sql
insert into public.student_cohort_memberships (profile_id, cohort_id, verified_at, verified_by)
select p.id, c.id, now(), '<TRUSTED_ADMIN_PROFILE_UUID>'::uuid
from public.profiles p
join public.cohorts c on c.code = '67'
where p.email = 'student@example.ac.th'
on conflict (profile_id, cohort_id) do update
set verified_at = excluded.verified_at,
    verified_by = excluded.verified_by;
```

Only use official, authorized roster data. Do not upload personal student data to a public repository.

## 7) Deploy the email worker

The sender is a Supabase Edge Function at `functions/send-notifications/index.ts` and uses Resend. It rechecks the latest email consent and email-enabled preference before sending.

Install Supabase CLI and link the project, then deploy:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy send-notifications
```

Set function secrets in the Supabase project (never in Vercel browser-visible variables):

```bash
supabase secrets set RESEND_API_KEY=YOUR_RESEND_API_KEY
supabase secrets set EMAIL_FROM="Science PR Portal <notices@example.ac.th>"
supabase secrets set SITE_URL=https://science-pr-portal.vercel.app
supabase secrets set WORKER_SECRET=GENERATE_A_LONG_RANDOM_SECRET
```

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Confirm those are available in the function environment before enabling delivery.

## 8) Schedule the email worker

Enable `pg_cron`, `pg_net`, and `vault` extensions in Supabase. Store the project URL and worker secret in Vault (run this only in the protected SQL Editor, and replace placeholders):

```sql
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'science_pr_project_url');
select vault.create_secret('YOUR_WORKER_SECRET', 'science_pr_worker_secret');

select cron.schedule(
  'science-pr-send-notifications',
  '* * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'science_pr_project_url')
        || '/functions/v1/send-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'science_pr_worker_secret')
      ),
      body := jsonb_build_object('triggered_at', now()),
      timeout_milliseconds := 10000
    );
  $$
);
```

The function is configured with JWT verification disabled only because the scheduled worker authenticates through the private `x-worker-secret` header. The function rejects calls without that exact secret. Rotate it if it is ever exposed.

## 9) Important rollout notes

- Existing prototype/localStorage announcements are not automatically migrated. Review and import them deliberately after confirming the data.
- Actual email delivery requires a verified sender domain and configured Resend account. Students must confirm their email, give separate email consent, enable email notifications, choose topics if desired, and have at least one official verified cohort membership before cohort-targeted announcement emails can be queued. Students can change or withdraw this setting in `/profile`.
- The student feed will show no cohort-targeted items until official verified cohort memberships exist.
- Social links/channels need the real faculty-owned URLs and API credentials before automatic posting to external platforms can be enabled.
- Confirm official channels, consent text, urgent-news criteria, and the student roster with the course before production launch.
- Run RLS tests with anonymous, student, admin, reviewer, and superadmin identities before publicly launching.
