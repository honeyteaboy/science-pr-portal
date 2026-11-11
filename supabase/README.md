# Science PR Portal — Supabase setup

This folder contains the production database schema and scheduled publishing logic for the existing Next.js/Vercel website.

## 1) Create a Supabase project

Create a project in Supabase, then copy its Project URL and Publishable key from Project Settings → API.

## 2) Apply the database migration

Open Supabase Dashboard → SQL Editor and run the full migration:

`migrations/202611110001_initial_pr_portal.sql`

The migration creates profiles, cohorts, topics, verified student cohort memberships, announcements, links, review records, preferences, email consents, notification outbox, audit history, RLS policies, publishing RPCs, and a one-minute scheduled publisher where pg_cron is available.

## 3) Configure Google OAuth

In Supabase Authentication → Providers → Google, configure the Google OAuth Client ID and Client Secret. Add the Supabase callback URL shown by the provider setup to the Google OAuth Authorized redirect URIs.

In Supabase Authentication → URL Configuration, set the Site URL to the production domain and add these Redirect URLs:

- https://science-pr-portal.vercel.app/auth/callback
- http://localhost:3000/auth/callback

The application requests only the identity scopes `openid email profile`. It does not request Gmail inbox or Gmail sending access.

## 4) Configure Vercel

Add the following variables to Production, Preview, and Development as appropriate:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not add a service-role key to a `NEXT_PUBLIC_` variable. Do not commit secrets to Git.

## 5) Assign staff roles

New Google sign-ins are created as `student` by default. After verifying staff identity, a trusted administrator can promote the matching profile in Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'secretary@example.ac.th';

update public.profiles
set role = 'reviewer'
where email = 'reviewer@example.ac.th';
```

Replace the example addresses only with verified institutional accounts. Do not use self-selected metadata to grant roles.

## 6) Verify cohort membership

Student feed targeting uses verified rows in `student_cohort_memberships`; students cannot verify their own cohort. Import or assign the official roster before relying on cohort-specific notices. Until verified, student accounts should not receive cohort-targeted email.

## 7) Email delivery

Published announcements are placed into `notification_outbox` only for verified cohort members whose email preference is on and whose consent is active. A trusted server-side worker/Edge Function must send those rows and mark delivery outcomes. Configure an approved email provider and retention policy before enabling real email.

## 8) Important rollout notes

- Keep the existing prototype/localStorage data as sample data until it is reviewed and imported. This migration does not automatically migrate browser-local data.
- Confirm official channels, consent text, emergency-news rules, and the student roster with the course before production launch.
- Run RLS tests with student, admin, reviewer, and anonymous accounts before sharing the site publicly.
