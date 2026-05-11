# Native Plant Survey App — Claude Code Reference

This file is loaded automatically every session. Read it before doing anything.

## What This App Is

A mobile field survey tool and map dashboard for two people who walk Lancaster County neighborhoods recording which houses have native plants. Built as a Progressive Web App saved to iPhone home screens.

Read `MISSION.md` for full context on why this exists. Read `ROADMAP.md` for the ordered task list.

## Stack — Never Deviate From This

| Layer | Tool |
|---|---|
| Frontend | Vanilla HTML / CSS / JS — no frameworks, no npm, no build step |
| Hosting | GitHub Pages — static files only |
| Database + Auth | Supabase (free tier) |
| Maps | Leaflet.js via CDN |
| Tiles | OpenStreetMap (free, no API key) |
| GPS | Browser Geolocation API |
| Reverse geocoding | Nominatim (OpenStreetMap) — free, no API key, max 1 req/second |

**No npm. No build step. No frameworks. Everything must work as static files served from GitHub Pages. Use CDN links for all libraries.**

## File Structure

```
native-plant-survey/
├── CLAUDE.md           # This file
├── MISSION.md          # Project context and goals
├── ROADMAP.md          # Phased task list
├── index.html          # Field app (GPS + Yes/No interface)
├── dashboard.html      # Map dashboard
├── app.js              # Field app logic
├── dashboard.js        # Dashboard logic
├── style.css           # Shared mobile-first styles
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (PWA requirement)
└── README.md           # Setup instructions
```

## Database Schema

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
```

## Security Rules — Never Compromise These

- Supabase Row-Level Security (RLS) must always be enabled on the `observations` table
- Only authenticated users may read or write any data
- The Supabase anon/publishable key (`sb_publishable_...`) is safe in frontend code — RLS is what protects the data
- The `service_role` / secret key must never appear anywhere in frontend code or be committed to the repo
- Sign-ups must be disabled in Supabase Auth settings — only the two owners may ever log in

```sql
alter table observations enable row level security;

create policy "Authenticated users can read"
  on observations for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert"
  on observations for insert
  with check (auth.uid() = user_id);
```

## Supabase JS CDN Import

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

The UMD bundle declares a global variable named `supabase`. Never name the client variable `supabase` in app code — it will collide. Use `client` instead:

```javascript
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

## GPS + Reverse Geocoding Pattern

Use `watchPosition()` for continuous GPS tracking. On each position update, if the user has moved more than 5 meters, fire a Nominatim reverse geocode request to update the displayed address. This means the address is pre-fetched while walking between houses — no waiting when the user stops in front of a house.

```javascript
// Nominatim reverse geocode — free, no API key
const res = await fetch(
  `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
  { headers: { 'Accept-Language': 'en' } }
);
const data = await res.json();
const address = data.address?.house_number
  ? `${data.address.house_number} ${data.address.road}`
  : data.display_name;
```

Respect Nominatim's 1 request/second limit — debounce calls with a 5-meter movement threshold.

## Non-Negotiable UI Rules

- Minimum button height: 80px (thumb-friendly while walking)
- Address display at top of Yes/No screen — always visible before tapping
- No tap allowed until GPS has a fix
- Every async operation (GPS, Supabase, geocoding) needs a visible loading and error state
- Test in Safari on iPhone — that is the primary target

## Cost Constraint

Every component must remain within its free tier indefinitely. Do not introduce any service with a paid requirement.
