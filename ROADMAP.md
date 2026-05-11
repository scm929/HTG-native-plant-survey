# Roadmap

Work through tasks in order. Each phase builds on the previous. Read `CLAUDE.md` and `MISSION.md` before starting.

---

## Phase 1 — Field Tool

### Task 1: Project scaffold — COMPLETE

- Create the file structure defined in `CLAUDE.md`
- `index.html` — mobile shell with correct viewport meta tag, links to `style.css` and `app.js`
- `manifest.json` — PWA manifest: name "Native Plant Survey", short name "Plant Survey", theme color green (`#2d7a2d`), display mode `standalone`, background color white
- `sw.js` — minimal service worker that satisfies Safari PWA install requirements (no offline caching needed yet)
- `style.css` — mobile-first base styles: system font stack, large tap targets (min 56px), no horizontal scroll, safe area insets for iPhone notch
- Confirm the project opens in Safari on iPhone without errors before moving on

### Task 2: Supabase setup guide — COMPLETE

Write `SUPABASE_SETUP.md` — a plain-English, step-by-step guide for a non-technical user to:
1. Create a free Supabase account at supabase.com
2. Create a new project (note: free tier allows 2 projects)
3. Run the SQL from `CLAUDE.md` to create the `observations` table and enable RLS policies
4. Enable Google as an OAuth provider in Supabase Auth (Authentication → Providers → Google)
5. Disable public sign-ups (Authentication → Settings → toggle off "Enable sign-ups")
6. Find and copy the project URL and publishable key (Settings → API Keys) into the constants in `app.js`

Guide is written and Supabase is fully configured — `observations` table created, RLS enabled, Google OAuth wired up, sign-ups disabled, and `app.js` populated with the live project URL and publishable key.

### Task 3: Google authentication

In `index.html` and `app.js`:
- Import Supabase JS v2 from CDN (see `CLAUDE.md`)
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are already set in `app.js` with live values — do not overwrite them
- On page load: check session state
  - Not logged in → show full-screen login view with "Sign in with Google" button, nursery name, and brief description
  - Logged in → show field tap interface
- Handle OAuth redirect callback correctly so user lands back in the app after Google login
- Show logged-in user's email in small text at top of screen with a "Sign out" link

### Task 4: GPS and reverse geocoding

In `app.js`:
- Start `navigator.geolocation.watchPosition()` after login is confirmed
- Track the most recent latitude and longitude in memory
- Track the last geocoded position; only fire a new Nominatim request when the user has moved more than 5 meters from the last geocoded point (use Haversine distance formula)
- On a new geocode result, update the address display at the top of the Yes/No screen
- Address format: house number + street name only (e.g. "412 Maple St") — not city, state, or zip
- GPS status indicator showing one of three states:
  - "Getting location…" — waiting for first fix
  - Address string — GPS active and address known
  - "Location unavailable — check GPS permissions" — if GPS fails or is denied
- Yes and No buttons must be disabled (grayed out, not tappable) until a GPS fix is established

### Task 5: Yes / No tap interface

In `index.html`, `app.js`, and `style.css`:
- Address display prominently at the top — large enough to read at a glance while walking
- Two large buttons below:
  - **YES** — green (`#2d7a2d`), label "Has native plants"
  - **NO** — red (`#c0392b`), label "No native plants"
  - Minimum height: 80px each. Consider making them fill most of the screen vertically — this is the primary interaction
- On tap:
  1. Capture current `latitude`, `longitude`, and `address` from the GPS watcher
  2. Insert row into Supabase `observations` table: `has_natives`, `latitude`, `longitude`, `address`, `user_id` (from auth session) — `created_at` is set automatically
  3. Show brief confirmation: green flash or toast "Saved!" visible for 1.5 seconds
  4. Return to ready state for next house
- On Supabase insert failure: show a persistent red error message, do not reset — allow the user to retry the same tap
- Disable buttons during the save operation to prevent double-taps

### Task 6: GitHub Pages deployment

- Add `README.md` with brief human-readable description and link to `SUPABASE_SETUP.md`
- Verify all file paths are relative — GitHub Pages requires this
- Confirm `manifest.json` and `sw.js` are in the repo root
- Add instructions to `README.md` for enabling GitHub Pages: Settings → Pages → Deploy from `main` branch, root folder (`/`)

**Phase 1 complete when:** Both users can install the app on their iPhones via Safari "Add to Home Screen", log in with Google, walk a street, and tap Yes or No for each house. Data appears in the Supabase table. Address shows correctly at the top of the screen.

---

## Phase 2 — Dashboard

### Task 7: Dashboard scaffold

- Create `dashboard.html` and `dashboard.js`
- Add "View Map →" link from `index.html` to `dashboard.html`
- Import Leaflet.js from CDN
- Initialize Leaflet map centered on Lancaster, Pennsylvania (lat: 40.0379, lng: -76.3055), zoom level 13
- Use OpenStreetMap tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` with correct attribution
- Require login — if not authenticated, redirect to `index.html`

### Task 8: Load and render observations

In `dashboard.js`:
- Fetch all rows from `observations` table after auth is confirmed
- Render each as a Leaflet circle marker:
  - Green (`#2d7a2d`, opacity 0.85) for `has_natives = true`
  - Red (`#c0392b`, opacity 0.85) for `has_natives = false`
  - Radius: 8px, white border 1.5px
- Popup on each marker: address, Yes/No, date recorded (formatted as "May 10, 2026"), recorded by (user email)
- Show a loading spinner while data fetches
- Show an error message if the fetch fails

### Task 9: Legend and controls

- Map legend (top-right corner): green dot = native plants, red dot = no native plants
- Toggle checkboxes: show/hide Yes markers and No markers independently
- Summary count below legend: "X yes · Y no · Z total"
- Controls must be readable and tappable on iPhone

### Task 10: Unsurveyed area indicator

Simple approach — do not over-engineer:
- Add a note in the legend: "Areas without dots have not been surveyed"
- The absence of markers is the visual cue; no need for overlay polygons at this stage
- Revisit in Phase 3 if a more explicit unsurveyed overlay is needed

**Phase 2 complete when:** Both users can open the dashboard, see all their observations on the map as colored dots, toggle layers, and see total counts.

---

## Phase 3 — Analytics (future — do not build yet)

- Task 11: Coverage percentage by street or neighborhood
- Task 12: Hotspot detection — streets near the 25% native coverage threshold
- Task 13: Target list view — ranked streets sorted by proximity to 25%
- Task 14: CSV export of all observations
- Task 15: Date range filter on dashboard
- Task 16: "Add to Home Screen" prompt — nudge users to install PWA if not already installed
