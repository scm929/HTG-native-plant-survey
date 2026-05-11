# Supabase Setup Guide

Follow these steps once to set up the database and login system for the Native Plant Survey app. You only need to do this once. Estimated time: 20–30 minutes.

You will need:
- A computer (not a phone) for this setup
- A Google account (the one you want to use to log in to the app)

---

## Part 1 — Create Your Supabase Account and Project

1. Open a browser and go to **supabase.com**. Click **Start your project** (or **Sign up**).

2. Sign up using your GitHub or Google account, or create an account with your email. Either works.

3. Once logged in, you'll land on your dashboard. Click **New project**.

4. Fill in the form:
   - **Organization** — leave the default or type your name
   - **Project name** — type `native-plant-survey`
   - **Database password** — click **Generate a password**, then copy it somewhere safe (like a Notes app). You may need it later.
   - **Region** — choose **US East (N. Virginia)** or the US region closest to you.

5. Click **Create new project**. Supabase will take about 1–2 minutes to set up. Wait for the spinner to finish.

---

## Part 2 — Create the Database Table

1. In the left sidebar, click **SQL Editor** (it looks like a terminal prompt `>`).

2. Click **New query**.

3. Copy **all** of the text in the box below and paste it into the editor:

```sql
create table observations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users not null,
  has_natives boolean not null,
  latitude    double precision not null,
  longitude   double precision not null,
  address     text
);

alter table observations enable row level security;

create policy "Authenticated users can read"
  on observations for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert"
  on observations for insert
  with check (auth.uid() = user_id);
```

4. Click the green **Run** button (or press Cmd+Enter on Mac / Ctrl+Enter on Windows).

5. You should see a message like `Success. No rows returned`. If you see an error, double-check that you copied the entire block above.

6. To confirm the table was created: click **Table Editor** in the left sidebar. You should see a table called `observations`.

---

## Part 3 — Set Up Google Login

This part requires setting up a Google project so the app can use "Sign in with Google." It takes about 10 minutes.

### Step A — Get Your Supabase Callback URL

1. In Supabase, click **Authentication** in the left sidebar, then click **Providers**.

2. Scroll down and click on **Google** to expand it.

3. You'll see a field labeled **Callback URL (for OAuth)**. It will look like:
   `https://abcdefghijkl.supabase.co/auth/v1/callback`

4. Copy that URL and paste it somewhere temporary (like a Notes app). You'll need it in Step B.

### Step B — Create a Google Cloud Project

1. Open a new browser tab and go to **console.cloud.google.com**. Sign in with the Google account you want to use for the app.

2. At the top of the page, click the project dropdown (it may say "Select a project" or show a project name). Click **New Project**.

3. Name it `native-plant-survey` and click **Create**. Wait a few seconds for it to be created, then make sure it's selected in the dropdown.

4. In the left sidebar, click **APIs & Services**, then **OAuth consent screen**.

5. Under "User Type," select **External**, then click **Create**.

6. Fill in the required fields:
   - **App name** — `Native Plant Survey`
   - **User support email** — your email address
   - **Developer contact information** (at the bottom) — your email address again

7. Click **Save and Continue** through the next two screens (Scopes and Test users) without changing anything. Click **Back to Dashboard** at the end.

8. In the left sidebar, click **Credentials**.

9. Click **+ Create Credentials** at the top, then choose **OAuth client ID**.

10. Under **Application type**, choose **Web application**.

11. Under **Name**, type `Native Plant Survey`.

12. Under **Authorized redirect URIs**, click **+ Add URI** and paste the Supabase callback URL you copied in Step A.

13. Click **Create**. A popup will show your **Client ID** and **Client Secret**. Copy both — paste them somewhere safe. You'll need them in the next step.

### Step C — Enter Google Credentials in Supabase

1. Go back to your Supabase tab. You should still be on **Authentication → Providers → Google**.

2. Paste your **Client ID** into the "Client ID (for OAuth)" field.

3. Paste your **Client Secret** into the "Client Secret (for OAuth)" field.

4. Toggle the **Enable Sign in with Google** switch to on (it should turn blue/green).

5. Click **Save**.

---

## Part 4 — Disable Public Sign-Ups

This prevents anyone other than the two of you from ever creating an account.

1. In Supabase, click **Authentication** in the left sidebar, then click **Settings** (or **Configuration** depending on your Supabase version — look for the gear icon under Authentication).

2. Find the toggle labeled **Enable sign-ups** (it may say "Allow new users to sign up").

3. Turn it **off**.

4. Click **Save**.

> After both of you have logged in for the first time, this setting ensures no new accounts can ever be created, even if someone knew your app URL.

---

## Part 5 — Connect the App to Your Supabase Project

1. In Supabase, click **Project Settings** (gear icon at the bottom of the left sidebar), then click **API Keys**.

2. You'll see two values you need:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **Publishable (anon) key** — a string starting with `sb_publishable_...`

   > If you see a tab labeled **Legacy anon, service_role API keys**, your project may still use the old format (a long string starting with `eyJ...`). Either format works — just copy whichever one is shown as the public/anon key.

3. Open the file `app.js` in a text editor (TextEdit on Mac, Notepad on Windows).

4. Near the top, find these two lines:
   ```
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```

5. Replace `YOUR_SUPABASE_URL` (including the quotes) with your Project URL, keeping the quotes:
   ```
   const SUPABASE_URL = 'https://abcdefghijkl.supabase.co';
   ```

6. Replace `YOUR_SUPABASE_ANON_KEY` the same way with your publishable/anon key.

7. Save the file.

---

## You're Done

Supabase is ready. The next step is deploying the app to GitHub Pages so both of you can access it from your iPhones. See `README.md` for deployment instructions.

If anything went wrong, double-check:
- The SQL ran without errors (Part 2)
- The Google callback URL in Google Cloud exactly matches the one from Supabase (Part 3, Steps A and B)
- The `anon`/publishable key in `app.js` — not the `service_role` or secret key, which must never be shared
